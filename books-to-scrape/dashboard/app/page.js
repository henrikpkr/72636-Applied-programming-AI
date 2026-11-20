import { createClient } from "@supabase/supabase-js";
import Charts from "./Charts";

export const revalidate = 60; // refresh data at most once a minute

async function getBooks() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const books = [];
  // Supabase returns max 1000 rows per request, so page through the table.
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("books")
      .select("category, price_gbp, rating, in_stock")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    books.push(...data);
    if (data.length < 1000) break;
  }
  return books;
}

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function computeStats(books) {
  const byCategory = {};
  for (const b of books) {
    const c = (byCategory[b.category || "Unknown"] ??= { count: 0, prices: [] });
    c.count++;
    c.prices.push(Number(b.price_gbp));
  }
  const categories = Object.entries(byCategory).map(([name, c]) => ({
    name,
    count: c.count,
    avgPrice: Number(avg(c.prices).toFixed(2)),
  }));

  const ratings = [1, 2, 3, 4, 5].map((r) => ({
    rating: `${r}★`,
    count: books.filter((b) => b.rating === r).length,
  }));

  const priceBins = [];
  for (let low = 10; low < 60; low += 10) {
    priceBins.push({
      range: `£${low}-${low + 10}`,
      count: books.filter((b) => b.price_gbp >= low && b.price_gbp < low + 10).length,
    });
  }

  return {
    total: books.length,
    avgPrice: avg(books.map((b) => Number(b.price_gbp))),
    avgRating: avg(books.map((b) => b.rating)),
    inStockPct: books.length ? (books.filter((b) => b.in_stock).length / books.length) * 100 : 0,
    topCategories: [...categories].sort((a, b) => b.count - a.count).slice(0, 10),
    priciestCategories: categories
      .filter((c) => c.count >= 3)
      .sort((a, b) => b.avgPrice - a.avgPrice)
      .slice(0, 10),
    ratings,
    priceBins,
  };
}

function Stat({ label, value }) {
  return (
    <div style={{ background: "white", borderRadius: 8, padding: 16, flex: 1, minWidth: 140, boxShadow: "0 1px 3px #0001" }}>
      <div style={{ fontSize: 13, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

export default async function Page() {
  const books = await getBooks();
  if (books.length === 0) {
    return <main style={{ padding: 32 }}>No books found. Run scraper.py first.</main>;
  }
  const s = computeStats(books);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
      <h1 style={{ marginTop: 0 }}>📚 Book Discovery Dashboard</h1>
      <p style={{ color: "#666" }}>Data scraped from books.toscrape.com, stored in Supabase.</p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <Stat label="Books" value={s.total} />
        <Stat label="Average price" value={`£${s.avgPrice.toFixed(2)}`} />
        <Stat label="Average rating" value={`${s.avgRating.toFixed(1)} / 5`} />
        <Stat label="In stock" value={`${s.inStockPct.toFixed(0)}%`} />
      </div>
      <Charts
        topCategories={s.topCategories}
        priciestCategories={s.priciestCategories}
        ratings={s.ratings}
        priceBins={s.priceBins}
      />
    </main>
  );
}
