-- Run this once in the Supabase SQL editor.
create table if not exists public.books (
  upc            text primary key,
  title          text not null,
  category       text,
  price_gbp      numeric(6,2),
  rating         smallint check (rating between 0 and 5),
  in_stock       boolean,
  stock_count    integer,
  description    text,
  product_url    text not null,
  image_url      text,            -- original image on books.toscrape.com
  image_path     text,            -- path inside the storage bucket
  image_public_url text,          -- public Supabase Storage URL
  scraped_at     timestamptz not null default now()
);

-- Public bucket for cover images (the scraper also creates it if missing).
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do nothing;
