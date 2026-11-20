"""Scrape books.toscrape.com and store the data + cover images in Supabase."""
from __future__ import annotations

import argparse
import logging
import mimetypes
import os
import re
import time
from typing import Iterator, Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import Client, create_client

BASE_URL = "https://books.toscrape.com/"
CATALOGUE_URL = urljoin(BASE_URL, "catalogue/page-1.html")
RATINGS = {"Zero": 0, "One": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5}
DELAY_SECONDS = 0.2  # be polite to the server

log = logging.getLogger("scraper")
session = requests.Session()
session.headers["User-Agent"] = "booksscrape-learning-project/1.0"


def get_soup(url: str) -> BeautifulSoup:
    for attempt in range(3):
        try:
            resp = session.get(url, timeout=20)
            resp.raise_for_status()
            resp.encoding = "utf-8"  # site omits charset; avoids mojibake in £
            time.sleep(DELAY_SECONDS)
            return BeautifulSoup(resp.text, "html.parser")
        except requests.RequestException as exc:
            log.warning("GET %s failed (%s), attempt %d/3", url, exc, attempt + 1)
            time.sleep(2 ** attempt)
    raise RuntimeError(f"Could not fetch {url}")


def iter_product_urls() -> Iterator[str]:
    """Walk the paginated catalogue and yield every book's detail-page URL."""
    url: Optional[str] = CATALOGUE_URL
    while url:
        soup = get_soup(url)
        for a in soup.select("article.product_pod h3 a"):
            yield urljoin(url, a["href"])
        nxt = soup.select_one("li.next a")
        url = urljoin(url, nxt["href"]) if nxt else None


def parse_book(url: str) -> dict:
    soup = get_soup(url)
    table = {
        row.th.get_text(strip=True): row.td.get_text(strip=True)
        for row in soup.select("table.table-striped tr")
    }
    crumbs = [a.get_text(strip=True) for a in soup.select("ul.breadcrumb li a")]
    category = crumbs[-1] if len(crumbs) >= 3 else None

    rating_cls = next(
        (c for c in soup.select_one("p.star-rating")["class"] if c in RATINGS), "Zero"
    )
    availability = table.get("Availability", "")
    stock_match = re.search(r"\((\d+) available\)", availability)

    price_text = soup.select_one("p.price_color").get_text(strip=True)
    desc_tag = soup.select_one("#product_description ~ p")

    return {
        "upc": table["UPC"],
        "title": soup.select_one("div.product_main h1").get_text(strip=True),
        "category": category,
        "price_gbp": float(re.sub(r"[^\d.]", "", price_text)),
        "rating": RATINGS[rating_cls],
        "in_stock": "In stock" in availability,
        "stock_count": int(stock_match.group(1)) if stock_match else 0,
        "description": desc_tag.get_text(strip=True) if desc_tag else None,
        "product_url": url,
        "image_url": urljoin(url, soup.select_one("#product_gallery img")["src"]),
    }


def ensure_bucket(sb: Client, bucket: str) -> None:
    existing = {b.name for b in sb.storage.list_buckets()}
    if bucket not in existing:
        sb.storage.create_bucket(bucket, options={"public": True})
        log.info("Created public bucket %r", bucket)


def upload_image(sb: Client, bucket: str, book: dict) -> None:
    resp = session.get(book["image_url"], timeout=30)
    resp.raise_for_status()
    ext = os.path.splitext(book["image_url"])[1] or ".jpg"
    path = f"{book['upc']}{ext}"
    content_type = mimetypes.guess_type(path)[0] or "image/jpeg"
    sb.storage.from_(bucket).upload(
        path,
        resp.content,
        file_options={"content-type": content_type, "upsert": "true"},
    )
    book["image_path"] = path
    book["image_public_url"] = sb.storage.from_(bucket).get_public_url(path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, help="only scrape the first N books (for testing)")
    parser.add_argument("--no-images", action="store_true", help="skip image upload")
    parser.add_argument("--dry-run", action="store_true", help="scrape but do not write to Supabase")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    load_dotenv()

    sb: Optional[Client] = None
    bucket = os.getenv("SUPABASE_BUCKET", "book-covers")
    if not args.dry_run:
        sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
        if not args.no_images:
            ensure_bucket(sb, bucket)

    done = 0
    for url in iter_product_urls():
        if args.limit and done >= args.limit:
            break
        try:
            book = parse_book(url)
            if sb is not None:
                if not args.no_images:
                    upload_image(sb, bucket, book)
                sb.table("books").upsert(book, on_conflict="upc").execute()
            done += 1
            log.info("[%d] %s", done, book["title"])
        except Exception:
            log.exception("Failed on %s, continuing", url)

    log.info("Done: %d books processed", done)


if __name__ == "__main__":
    main()
