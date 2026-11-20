# 72636 Applied Programming with AI: individual submission

All three course projects are in this repository, one folder per project. Each folder has its own `README.md` (purpose, data collection, persistence, user interaction, setup, learning, limitations) and an `AUDIT.md` with the publication audit.

| # | Project | Folder | What it does | Stack |
|---|---------|--------|--------------|-------|
| 1 | Momentum Dash replica | [browser-extension/](browser-extension/) | Chrome new tab dashboard (clock, greeting, daily focus, to-dos, quote) with a built-in, fully local file-to-Markdown converter | JavaScript, Chrome MV3, Vite |
| 2 | Books to Scrape | [books-to-scrape/](books-to-scrape/) | Scrapes books.toscrape.com, stores books and covers in Supabase and shows statistics on a dashboard | Python, Supabase (Postgres + Storage), Next.js |
| 3 | TVmaze API | [tvmaze/](tvmaze/) | Swipe-style TV show discovery built on the TVmaze API. Likes are saved in SQLite and shape the next shows | Node.js (no dependencies), SQLite |

## Quick start

```bash
git clone https://github.com/henrikpkr/72636-Applied-programming-AI.git
cd 72636-Applied-programming-AI
```

| Project | Run |
|---------|-----|
| browser-extension | `cd browser-extension && npm install && npm run build`, then load `dist/` in `chrome://extensions` (Developer mode → Load unpacked) |
| books-to-scrape | Needs a free Supabase project: see [its README](books-to-scrape/README.md#setup) |
| tvmaze | `cd tvmaze && node server.js` (Node 22.13+), then open http://localhost:3001 |

## Repository notes

- Projects 2 and 3 were developed in separate repositories and merged in here with their commit history (`git log` shows the original commits). Project 1 was not under version control before and was added as a new commit.
- No secrets are committed. Configuration templates are in the `*.example` files. See each project's `AUDIT.md` for what was checked, what was found and what was fixed.
