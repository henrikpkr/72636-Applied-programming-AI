# booksscrape

A Python web scraper that collects the full catalogue of [books.toscrape.com](https://books.toscrape.com/) (a sandbox site built for scraping practice), stores the structured data in a **Supabase (PostgreSQL)** table, and uploads the cover images to **Supabase Storage**. The data is then queryable through Supabase's auto-generated REST API.

## How it works

```
books.toscrape.com ──requests + BeautifulSoup──> scraper.py ──supabase-py──> Postgres table `books`
                                                                       └────> Storage bucket `book-covers`
```

1. **Crawl** – `iter_product_urls()` walks the paginated catalogue (`catalogue/page-1.html` onward, following the "next" link) and yields every book's detail-page URL.
2. **Parse** – `parse_book()` extracts, per book: UPC, title, category (from the breadcrumb), price in GBP, star rating (0–5, mapped from CSS class), stock status and count, description, product URL and image URL.
3. **Upload image** – the cover is downloaded and stored in the public `book-covers` bucket as `<upc>.jpg`; its public URL is saved with the record.
4. **Upsert** – the record is written to `books` with `on_conflict="upc"`, so re-running the scraper updates existing rows instead of creating duplicates (idempotent).

Robustness: requests retry 3× with exponential backoff, a 0.2 s delay between requests keeps the load on the server low, and a failure on one book is logged and skipped rather than aborting the run.

## Project structure

| File | Purpose |
|---|---|
| `scraper.py` | Crawler, parser, and Supabase writer (CLI) |
| `schema.sql` | Table definition and storage bucket, run once in Supabase |
| `requirements.txt` | Python dependencies |
| `supabase/config.toml` | Supabase CLI project config (for optional local development) |
| `.env` | Credentials (not committed) |

## Setup

**Requirements:** Python 3.9+ and a free [Supabase](https://supabase.com) project.

```bash
# 1. Install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 2. Create the table and bucket:
#    paste schema.sql into Supabase Dashboard -> SQL Editor -> Run

# 3. Configure credentials
cat > .env <<'EOF'
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=<service_role key>   # Project Settings -> API. Server-side only, never commit!
SUPABASE_BUCKET=book-covers
EOF
```

## Usage

```bash
python scraper.py                  # scrape all ~1000 books + images
python scraper.py --limit 10       # only the first 10 books (quick test)
python scraper.py --no-images      # skip image upload
python scraper.py --dry-run        # scrape and log only, write nothing to Supabase
```

## Data model (`public.books`)

| Column | Type | Notes |
|---|---|---|
| `upc` | text | **Primary key** (unique product code) |
| `title` | text | required |
| `category` | text | e.g. "Poetry" |
| `price_gbp` | numeric(6,2) | |
| `rating` | smallint | 0–5, enforced by `CHECK` |
| `in_stock` | boolean | |
| `stock_count` | integer | |
| `description` | text | |
| `product_url` | text | required |
| `image_url` | text | original image on books.toscrape.com |
| `image_path` / `image_public_url` | text | file path and public URL in Supabase Storage |
| `scraped_at` | timestamptz | defaults to `now()` |

## API

The project does not run its own server. Supabase automatically exposes the `books` table as a REST API (PostgREST) at `https://<project-ref>.supabase.co/rest/v1/books`. Authenticate with the project's `anon` key (Project Settings -> API); `schema.sql` enables Row Level Security with a public read-only policy. The scraper itself uses the `service_role` key, which bypasses RLS and is the only one that can write.

```bash
# 5 highest-rated books under £20, cheapest first
curl "$SUPABASE_URL/rest/v1/books?select=title,price_gbp,rating&rating=eq.5&price_gbp=lt.20&order=price_gbp.asc&limit=5" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# All books in one category, with cover image URL
curl "$SUPABASE_URL/rest/v1/books?category=eq.Poetry&select=title,image_public_url" \
  -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

Or from Python:

```python
from supabase import create_client
sb = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
sb.table("books").select("title, price_gbp").eq("category", "Poetry").order("price_gbp").execute().data
```

Cover images are served publicly at `$SUPABASE_URL/storage/v1/object/public/book-covers/<upc>.jpg`.

## Tech stack

Python · `requests` · `BeautifulSoup4` · `supabase-py` · `python-dotenv` · Supabase (PostgreSQL + Storage + PostgREST)
