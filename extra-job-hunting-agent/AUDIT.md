# Publication audit: Job Hunting Agent (extra work)

Audit performed with Claude Code (Anthropic) using the course audit prompt, from the `extra-job-hunting-agent/` folder (and, before the merge, on the original `JobHuntingAgent` repository). Two rounds were run: round 1 before the fixes and round 2 after them. No secret values or personal details are recorded here.

## What was checked

- All project files, the Git status, the ignored files and the tracked files, including the full history of the original repository (30 commits on the latest branch, merged here with history)
- Secrets, credentials and personal data in the working tree and in every commit, including binary files such as SQLite databases
- Files that should be excluded (`.env`, the SQLite database, `.venv/`, `node_modules/`, `dist/`, caches, generated output)
- `.gitignore` rules
- Dependencies, setup instructions and configuration examples
- README coverage of the required topics
- The frontend's handling of data from external job APIs

## Round 1 findings

### Confirmed issues (had to be resolved before publishing)

| # | Issue | Location | Action |
| --- | --- | --- | --- |
| 1 | **Personal data in Git history.** The SQLite database was committed in 9 commits. It held uploaded CV text, including a real CV with name, email, phone number and LinkedIn profile. A later commit deleted it and `.gitignore` excluded it, but every earlier version was still readable | `backend/data/jobhunter.sqlite3` (history only) | **Fixed in this repository.** The file was removed from every commit with `git filter-branch` before the merge, then the refs and reflog were expired and the repository garbage-collected. **Also required:** the original `JobHuntingAgent` repository is public on GitHub and still contains these commits. Its owner has to make it private, or rewrite its history and ask GitHub to purge cached views |
| 2 | **Unescaped external data in the page (XSS).** Job title, company, location, source and posting URL from the job APIs were put into `innerHTML` without escaping, and the URL was used as a link without checking its scheme. A posting with HTML or a `javascript:` URL could run script in the app | `frontend/src/main.js` (`renderResultCard`, `renderLikedJobCard`) | **Fixed.** All these fields go through `escapeHtml`, and only `http`/`https` links are rendered (`safeUrl`). The CV name and headline in the profile summary are escaped too |
| 3 | No configuration example in the current tree (it existed in early commits and was later deleted) | `backend/.env.example` | **Fixed.** Re-added with empty placeholders, only for the variables the code reads |
| 4 | README did not cover purpose, data collection, persistence, user interaction, learning or limitations, and had no screenshot. It also did not say the project is extra work or group work | `README.md` | **Fixed.** Rewritten with all 7 sections, a clear "extra work" and co-author note, and `docs/screenshot-results.png` |

### Recommended improvements

| # | Improvement | Location | Action |
| --- | --- | --- | --- |
| 5 | Generated scraper output (`backend/output/*.json`) was in history | `backend/output/` | **Fixed.** Removed from every commit together with issue 1, and ignored |
| 6 | Empty npm lock files in a Python folder and the repository root, and an editor launch file | `package-lock.json`, `backend/package-lock.json`, `.claude/launch.json` | **Fixed.** Removed. `.claude/` is ignored |
| 7 | `.gitignore` did not cover `.pytest_cache/` or other database files (`learning_jobs.db` from the learning scripts) | `.gitignore` | **Fixed.** Added `.pytest_cache/`, `*.db`, `*.sqlite3`, `backend/output/` |
| 8 | Package description listed sites the code does not use (LinkedIn, Xing, StepStone, Indeed, Glassdoor) | `backend/pyproject.toml` | **Fixed.** Description now matches the app |
| 9 | The health monitor's "Try fix" executes LLM-generated Python, and "Apply fix" overwrites source files. Both endpoints have no authentication. CORS limits reading the responses to localhost pages, but a simple cross-site `POST` can still be sent | `backend/src/jobhunter/agent/health_monitor.py`, `api/routes.py` | **Not changed.** The server only listens on `127.0.0.1`, and a fix can only run after the monitor has proposed one. Documented under Limitations. Next step would be a confirmation token or removing "Try fix" |
| 10 | The CV notebook (`backend/scripts/.ipynb`) contains saved output | `backend/scripts/.ipynb` | **Not changed.** The output is public Greenhouse job data, no personal data |

### Possible concerns (reviewed, no action needed)

- **Bundesagentur client id in the code.** `scrapers/bundesagentur.py` has a default `X-API-Key` value. It is the publicly documented client id of the agency's job search API, not a personal secret.
- **Test fixtures with emails.** The CVs in `backend/tests/fixtures/cvs/` and the test files use invented people and `example.com` addresses.
- **Commit metadata.** The imported commits keep the original author names and emails of both authors. These are already public in the original repository.
- **SQL injection.** Queries use parameters. No string-built SQL with user input was found.
- **Upload size.** CV uploads are capped at 5 MB.

## Round 2 (after fixes)

| Check | Result |
| --- | --- |
| Any `.db`/`.sqlite3` file or `backend/output/` in any commit of this repository | Not present |
| CV owner's name in any imported file diff in history | Not present |
| Secret patterns (API keys, tokens, private keys) in the imported history | None found |
| `git check-ignore` on `backend/.env`, `backend/data/jobhunter.sqlite3`, `backend/data/learning_jobs.db`, `backend/.venv` | All ignored. `backend/.env.example` is tracked |
| Backend tests (`pytest`) | 241 passed |
| Frontend build (`vite build`) | OK |
| App starts, CV upload (fake fixture CV) and live search return ranked jobs, cards render escaped | OK, see screenshot |
| README has all 7 required sections | Yes |

## Remaining limitations / not verified

- **Confirmed:** the original `JobHuntingAgent` repository on GitHub is public and still contains the database with the CV in its history. This repository is clean, but the original must be made private or have its history rewritten by its owner.
- **Not verified:** whether the original repository was cloned or forked by others while the database was public.
- The co-author agreed to the project being part of this submission: to be confirmed by the owner, not by this audit.
- Finding no issues in the automated checks does not prove the project is free of problems.
