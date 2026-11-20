import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tvmaze } from './providers.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 3001;
// Local-only by default: the API has no authentication. Set HOST=0.0.0.0 to expose it on your network.
const HOST = process.env.HOST || '127.0.0.1';
await mkdir(join(ROOT, 'data'), { recursive: true });

const db = new DatabaseSync(join(ROOT, 'data', 'swipes.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS titles (
    id TEXT PRIMARY KEY, source TEXT, kind TEXT, name TEXT, year INTEGER,
    genres TEXT, summary TEXT, image TEXT, rating REAL, url TEXT
  );
  CREATE TABLE IF NOT EXISTS swipes (
    title_id TEXT PRIMARY KEY REFERENCES titles(id),
    decision TEXT NOT NULL CHECK (decision IN ('like','dislike')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const upsertTitle = db.prepare(`INSERT OR REPLACE INTO titles
  (id,source,kind,name,year,genres,summary,image,rating,url)
  VALUES (?,?,?,?,?,?,?,?,?,?)`);
const upsertSwipe = db.prepare(`INSERT OR REPLACE INTO swipes (title_id,decision) VALUES (?,?)`);
const deleteSwipe = db.prepare(`DELETE FROM swipes WHERE title_id = ?`);
const swiped = () => new Set(db.prepare('SELECT title_id FROM swipes').all().map((r) => r.title_id));

// Preference model: liked-genre frequency boosts matching titles in the deck.
function genreScores() {
  const rows = db.prepare(`SELECT t.genres, s.decision FROM swipes s JOIN titles t ON t.id = s.title_id`).all();
  const score = {};
  for (const r of rows) for (const g of JSON.parse(r.genres)) score[g] = (score[g] || 0) + (r.decision === 'like' ? 1 : -0.5);
  return score;
}

async function buildDeck(n, kind) {
  const seen = swiped();
  const pool = new Map();
  for (let i = 0; i < 4 && pool.size < n * 4; i++) {
    const list = await tvmaze.fetch();
    for (const t of list) if (!seen.has(t.id) && (!kind || t.kind === kind)) pool.set(t.id, t);
  }
  const scores = genreScores();
  const ranked = [...pool.values()]
    .map((t) => ({ t, s: t.genres.reduce((a, g) => a + (scores[g] || 0), 0) / Math.max(1, t.genres.length) + Math.random() * 2 }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.t);
  return ranked;
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
const body = async (req) => { let b = ''; for await (const c of req) b += c; return b ? JSON.parse(b) : {}; };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname === '/api/deck') {
      const kind = url.searchParams.get('kind') || undefined;
      return json(res, 200, await buildDeck(Math.min(+url.searchParams.get('n') || 10, 30), kind));
    }
    if (url.pathname === '/api/config') return json(res, 200, { hasMovies: false });
    if (url.pathname === '/api/swipe' && req.method === 'POST') {
      const { title, decision } = await body(req);
      if (!title?.id || !['like', 'dislike'].includes(decision)) return json(res, 400, { error: 'bad request' });
      upsertTitle.run(title.id, title.source, title.kind, title.name, title.year ?? null, JSON.stringify(title.genres || []),
        title.summary, title.image, title.rating ?? null, title.url);
      upsertSwipe.run(title.id, decision);
      return json(res, 200, { ok: true });
    }
    if (url.pathname.startsWith('/api/swipe/') && req.method === 'DELETE') {
      deleteSwipe.run(decodeURIComponent(url.pathname.slice('/api/swipe/'.length)));
      return json(res, 200, { ok: true });
    }
    if (url.pathname === '/api/likes') {
      const rows = db.prepare(`SELECT t.*, s.decision, s.created_at FROM swipes s JOIN titles t ON t.id = s.title_id
        WHERE s.decision = ? ORDER BY s.created_at DESC, s.rowid DESC`).all(url.searchParams.get('decision') === 'dislike' ? 'dislike' : 'like');
      return json(res, 200, rows.map((r) => ({ ...r, genres: JSON.parse(r.genres) })));
    }
    if (url.pathname === '/api/stats') {
      const counts = db.prepare(`SELECT decision, COUNT(*) c FROM swipes GROUP BY decision`).all();
      const top = Object.entries(genreScores()).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([g]) => g);
      return json(res, 200, { counts: Object.fromEntries(counts.map((c) => [c.decision, c.c])), topGenres: top });
    }
    // static
    const path = normalize(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^(\.\.[/\\])+/, '');
    const data = await readFile(join(ROOT, 'public', path));
    res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    if (e.code === 'ENOENT') { res.writeHead(404); return res.end('Not found'); }
    console.error(e);
    json(res, 500, { error: e.message });
  }
}).listen(PORT, HOST, () => console.log(`tv-place → http://localhost:${PORT}  (source: TVmaze)`));
