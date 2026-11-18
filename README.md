# tv-place

Swipe through TV series, Tinder-style. Right (or ♥) means you like it, left (or ✕) means pass. Your choices are saved in a local SQLite database and shape what you see next.

Show data comes from the free [TVmaze API](https://www.tvmaze.com/api), so no API key is needed.

## Run it

Requires Node 22.13 or newer. There is nothing to install.

```
node server.js
```

Open http://localhost:3000. Set `PORT` to use a different port.

## How it works

- **Deck:** the server fetches a random page of shows from TVmaze. It keeps shows rated 6.5 or higher that have a poster and a summary, and it skips anything you've already swiped.
- **Swiping:** drag a card, use the ← and → keys, or tap the buttons. Press Z or ↺ to undo.
- **Storage:** each swipe is saved to `data/swipes.db` (created on first run, git-ignored). It has a `titles` table for show details and a `swipes` table for your like/pass decisions.
- **Taste:** liked genres score up and passed genres score down. Shows in genres you like are ranked higher in the next deck.
- **Lists:** the "Liked" and "Passed" tabs show your saved choices. You can remove an entry there to take it back out of the database.

## Files

| File | Purpose |
| --- | --- |
| `server.js` | HTTP server, JSON API and SQLite storage |
| `providers.js` | TVmaze client |
| `public/index.html` | Swipe UI |

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/deck?n=10` | Unswiped titles |
| `POST /api/swipe` | Body `{ title, decision: "like" \| "dislike" }` |
| `DELETE /api/swipe/:id` | Undo a swipe |
| `GET /api/likes?decision=like\|dislike` | Saved swipes |
| `GET /api/stats` | Counts and top genres |
