# Publication audit: browser extension

Audit performed with Claude Code (Anthropic) using the course audit prompt, from the `browser-extension/` folder. Two rounds were run: round 1 before the fixes and round 2 after them. No secret values are recorded here.

## What was checked

- All project files, the Git status and the tracked files (`git ls-files`)
- Secrets, credentials and personal data in the working tree and the full Git history
- Files that should be excluded (dependencies, build output, OS files, local configuration)
- `.gitignore` rules
- Dependencies, setup instructions and configuration examples
- README coverage: purpose, data collection, persistence, user interaction, setup, learning, limitations

## Round 1 findings

### Confirmed issues (had to be resolved before publishing)

| # | Issue | Location | Action |
| --- | --- | --- | --- |
| 1 | No README | `browser-extension/` | **Fixed.** Wrote `README.md` with all required sections and a screenshot |
| 2 | No `.gitignore` in the project. `node_modules/` (about 48 packages) and `dist/` existed locally and would be committed by a plain `git add .` | project root | **Fixed.** Added `.gitignore` (`node_modules/`, `dist/`, `.DS_Store`). The repository root `.gitignore` covers them as well |
| 3 | The project was a converter popup only, not the assignment's Momentum Dash style new tab extension | `public/manifest.json` | **Fixed.** Added a new tab page (clock, greeting, daily focus, to-dos, quote, daily background) with the converter integrated |
| 4 | CSV converter: a `\|` inside a cell broke the Markdown table, and a trailing newline produced an empty row | `converters/csv.js` | **Fixed.** Cells are escaped, line breaks flattened, `skipEmptyLines: true` |

### Recommended improvements

| # | Improvement | Location | Action |
| --- | --- | --- | --- |
| 5 | `package.json` had placeholder metadata: empty description, `main: index.js` (doesn't exist) and a failing `test` script | `package.json` | **Fixed.** Name, version and description set, placeholders removed |
| 6 | The extension was called "Markdownify AI", but it uses no AI | `manifest.json`, `popup.html` | **Fixed.** Renamed to "Markdownify Tab" / "Markdownify" |
| 7 | Downloads were always named `converted.md` | `converters/index.js` | **Fixed.** Uses the source file name |
| 8 | No extension icons | `public/` | **Not changed.** Cosmetic only, listed under Limitations |
| 9 | Large bundle warning (about 2 MB, from pdf.js) | build output | **Not changed.** pdf.js has to be bundled under MV3. Listed under Limitations |

### Possible concerns (not confirmed)

- None found regarding secrets: the extension has no keys, makes no network requests and asks only for the `storage` permission.

## Round 2 (after fixes)

| Check | Result |
| --- | --- |
| Secret patterns (API keys, JWTs, private keys, tokens) in the tree and full history | None found |
| Tracked files include `node_modules/`, `dist/` or `.DS_Store` | No |
| `git check-ignore` on `node_modules/`, `dist/` | Both ignored |
| `npm install && npm run build` | Builds successfully |
| README has all 7 required sections | Yes |
| New tab page loads, and dropping an `.html` file gives correct Markdown | Yes (tested in headless Chrome, see screenshot) |

## Remaining limitations / not verified

- Not tested in browsers other than Chrome on macOS. There are no automated tests.
- `.docx` and `.pdf` conversion was not re-tested in round 2. Only the converter wiring changed, not those modules.
- Finding no issues in the automated checks does not prove the project is free of problems.
