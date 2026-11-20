# Publication audit: TVmaze (tv-place)

Audit performed with Claude Code (Anthropic) using the course audit prompt, from the `tvmaze/` folder. Two rounds were run: round 1 before the fixes and round 2 after them. No secret values are recorded here.

## What was checked

- All project files, the Git status and the tracked files, including the full history of the original `tv-place` repository (4 commits, merged here with history)
- Secrets, credentials and personal data in the working tree and every commit
- Files that should be excluded (the SQLite database in `data/`, `.env`, `node_modules/`)
- `.gitignore` rules
- Dependencies, setup instructions and configuration
- README coverage of the required topics

## Round 1 findings

### Confirmed issues (had to be resolved before publishing)

| # | Issue | Location | Action |
| --- | --- | --- | --- |
| 1 | **An API key in Git history.** A `test.py` script for a different TV API (not TVmaze) contained a hardcoded key. A later commit deleted the file, but the key was still readable in the earlier commit | `test.py` (history only) | **Fixed in this repository.** `test.py` was removed from every commit with `git filter-branch`, the backup refs and reflog were expired, and the repository was garbage-collected. **Also required:** the key must be revoked at the provider, and the original `tv-place` repository (which still contains the commit) must be made private or deleted |
| 2 | The server listened on all network interfaces. Its API has no authentication, so anyone on the same network could read or change swipes | `server.js` | **Fixed.** Binds to `127.0.0.1` by default, with an opt-in `HOST` variable |
| 3 | README was missing the Purpose, User interaction, Learning and Assistance sections and a screenshot | `README.md` | **Fixed.** Added them, plus `docs/screenshot-swipe.png` |

### Recommended improvements

| # | Improvement | Location | Action |
| --- | --- | --- | --- |
| 4 | `POST /api/swipe` trusts the title details sent by the browser | `server.js` | **Not changed.** Harmless for a single local user. Already documented under Limitations |
| 5 | No automated tests | project | **Not changed.** Listed under Limitations |

### Possible concerns (reviewed, no action needed)

- **Static file serving and path traversal.** Paths are normalised and leading `../` removed before joining with `public/`, and the URL parser also resolves `..`. No traversal outside `public/` was found.
- **XSS from TVmaze data.** Show names and summaries are inserted with `textContent`, not `innerHTML`, and summaries are stripped of HTML on the server.
- **SQL injection.** Every query with user input uses prepared statements.
- **No configuration example.** Not needed: there are no secrets or required settings, and `PORT`/`HOST` are documented in the README.

## Round 2 (after fixes)

| Check | Result |
| --- | --- |
| `test.py` or the API key in any commit (`git log --all -- test.py`, content search) | Not present |
| Other secret patterns in the tree and full history | None found |
| `git check-ignore` on `data/swipes.db`, `.env` | Both ignored |
| `node --check server.js providers.js` | OK |
| App starts, `GET /api/deck` returns TVmaze shows, UI renders | OK, see screenshot |
| README has all 7 required sections | Yes |

## Remaining limitations / not verified

- **Could not verify** whether the leaked key has been revoked at the provider. The owner has to do this.
- **Confirmed:** the original `tv-place` GitHub repository is public, so the key is still exposed in its history until that repository is made private or deleted and the key is revoked.
- Finding no issues in the automated checks does not prove the project is free of problems.
