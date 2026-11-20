// TVmaze provider (https://www.tvmaze.com/api). Public API, no key needed.
const strip = (h) => (h || '').replace(/<[^>]+>/g, '').trim();
const pick = (a) => a[Math.floor(Math.random() * a.length)];

async function getJSON(url, opts) {
  const r = await fetch(url, { signal: AbortSignal.timeout(10000), ...opts });
  if (!r.ok) throw new Error(`${r.status} ${url.replace(/api_key=[^&]+/, 'api_key=…')}`);
  return r.json();
}

// ---- TVmaze: 250 shows per page, ~300 pages ----
const tvmaze = {
  async fetch() {
    const page = Math.floor(Math.random() * 280);
    let shows;
    try { shows = await getJSON(`https://api.tvmaze.com/shows?page=${page}`); }
    catch { return []; }
    return shows
      .filter((s) => s.image?.medium && s.rating?.average >= 6.5 && s.summary)
      .map((s) => ({
        id: `tvmaze:${s.id}`,
        source: 'tvmaze',
        kind: 'series',
        name: s.name,
        year: s.premiered ? +s.premiered.slice(0, 4) : null,
        genres: s.genres || [],
        summary: strip(s.summary),
        image: s.image.original || s.image.medium,
        rating: s.rating.average,
        url: s.url,
      }));
  },
};

export { pick, tvmaze };
