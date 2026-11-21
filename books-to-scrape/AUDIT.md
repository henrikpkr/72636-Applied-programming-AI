# Publication audit: Books to Scrape

Audit performed with Claude Code (Anthropic) using the course audit prompt, from the `books-to-scrape/` folder. Two rounds were run: round 1 before the fixes and round 2 after them. No secret values or project identifiers are recorded here.

## What was checked

- All project files, the Git status and the tracked files, including the full history of the original `booksscrape` repository (4 commits, merged here with history)
- Secrets, credentials and personal data in the working tree and every commit
- Files that should be excluded (`.env`, `.venv/`, `node_modules/`, `.next/`, OS files)
- `.gitignore` rules for the scraper, the dashboard and the Supabase CLI folder
- Dependencies, setup instructions and configuration examples
- README coverage of the required topics

## Round 1 findings

### Confirmed issues (had to be resolved before publishing)

| # | Issue | Location | Action |
| --- | --- | --- | --- |
| 1 | README told users to `cp .env.local.example .env.local`, but that file didn't exist | `dashboard/` | **Fixed.** Added `dashboard/.env.local.example` with placeholder values |
| 2 | No configuration template for the scraper (the README created `.env` with a heredoc) | project root | **Fixed.** Added `.env.example` with placeholders and changed the README to `cp .env.example .env` |
| 3 | README was missing the Learning and Limitations/assistance sections, a screenshot and an explicit data persistence section | `README.md` | **Fixed.** Added all required sections apart from learning as this is the students input and `docs/screenshot-dashboard.png` |

### Recommended improvements

| # | Improvement | Location | Action |
| --- | --- | --- | --- |
| 4 | An untracked `.DS_Store` sat in the original repo and wasn't ignored | `.gitignore` | **Fixed.** Added `.DS_Store` to the project `.gitignore` (and to the root one) |
| 5 | `inStockPct` divided by zero when the table is empty, so the dashboard would show `NaN%` | `dashboard/app/page.js` | **Fixed.** Returns 0 for an empty table |
| 6 | Python dependencies use `>=` instead of pinned versions | `requirements.txt` | **Not changed.** Acceptable for a course project. Pinning would improve reproducibility |
| 7 | No automated tests for the HTML parser | `scraper.py` | **Not changed.** Listed under Limitations |

### Possible concerns (reviewed, no action needed)

- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`.** The `NEXT_PUBLIC_` prefix means the anon key may reach the browser. That is intended by Supabase: the anon key is public, and `schema.sql` enables Row Level Security with a read-only policy. The secret `service_role` key is only read by `scraper.py` from `.env`, which is git-ignored.
- **`supabase/config.toml`** is the CLI's default template. It references secrets only as `env(...)` placeholders and contains no real values.
- **Local `.env`, `.env.local` and `.venv/`** existed in the original working folder. They were never tracked in any commit and are ignored here.
- **Commit metadata** contains the author's name and university e-mail address. That is normal for a graded submission and was left as is.

## Round 2 (after fixes)

| Check | Result |
| --- | --- |
| Secret patterns (JWT-style keys, `sb_secret_`, private keys, tokens) in the tree and full history | None found |
| Supabase project URLs in tracked files | Only placeholders (`<project-ref>`, `your-project-ref`) |
| `git check-ignore` on `.env`, `dashboard/.env.local`, `.venv/` | All ignored |
| Tracked `.env*` files | Only the two `*.example` templates |
| `python3 -m py_compile scraper.py` | OK |
| Dashboard runs against the database (`next dev`) | OK, see screenshot |
| README has all 7 required sections | Yes |

## Remaining limitations / not verified

- A full scraper run was not repeated during the audit (to avoid writing to the live database). The database holds 826 of the roughly 1000 books.
- The Supabase project's own settings (RLS state in the hosted database, bucket policies) were not inspected, only `schema.sql`.
- Finding no issues in the automated checks does not prove the project is free of problems.
