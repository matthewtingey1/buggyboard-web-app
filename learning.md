# Learning BuggyBoard

## 1. Tech stack

| Layer    | Choice                                                                              |
| -------- | ----------------------------------------------------------------------------------- |
| Language | TypeScript everywhere                                                               |
| Frontend | React 18 + React Router 7, styled with Tailwind, built with Vite (`frontend/`)      |
| Backend  | Express 4 on Node, run with `tsx watch` (`backend/`)                                |
| Database | SQLite via `better-sqlite3`, one file at `backend/data/buggyboard.db`               |
| Tooling  | npm workspaces, `concurrently`, ESLint, Prettier, Playwright (added for the course) |

- `npm run dev` starts both: frontend on http://localhost:5173, backend on port 3002 (changed locally from 3000 to avoid a clash).
- Vite proxies `/api/*` to the backend, so the browser only talks to 5173.
- The `bugs` table is created at startup with `CREATE TABLE IF NOT EXISTS`. There are no migrations.

## 2. User credentials

- Accounts live in plain text in `users.json` at the project root, as `{ "username", "password" }` objects.
- Defaults: `buggy` / `1970beetle` and `vanny` / `1979bus`.
- The file is re-read on every login, so a new user works without restarting.
- `POST /api/login` trims the username (not the password) and returns distinct errors for blank username, blank password, both blank, and a generic "Invalid username or password" for anything else.
- The "session" is only `localStorage["buggyboard_user"] = {"username": ...}` on the frontend. There is no token or cookie, and **the `/api/bugs` endpoints don't check authentication at all**.
- `POST /api/login` refuses a client and exact username after 20 failed attempts in a row (429, with `Retry-After`) until 15 minutes pass or a login succeeds.

## 3. Main behaviors

- **Login** at `/login`; any other route redirects there when not logged in. Logged-in users hitting `/login` go to `/board`. The session survives a refresh.
- **Title bar**: logo, title, search field, **New Bug** button, **Logout** button.
- **Board** at `/board`: table of ID, Severity, Title, Owner. Severity is color-coded (HIGH terracotta, MID amber, LOW sage).
- **Sort**: any column; default is Severity descending. Clicking toggles asc/desc, and the first click on a new column is ascending. One column at a time.
- **Search**: filters by title only, live, case-insensitive, whitespace-collapsed, punctuation-normalized (`login` matches `log-in`; fixed 2026-09-22). An X clears it. Sort is preserved.
- **State filter**: Open/Closed toggle above the table, default Open. If nothing matches, the board shows "no bugs matched".
- **Create bug**: all fields required. Owner defaults to the current user. New bugs are always Open.
- **Edit bug**: click a row. ID is read-only; Save is disabled when nothing changed or a field is blank. State can be changed here.
- **Delete bug**: from the edit modal, with a confirmation modal ("Are you sure you want to delete bug #ID: Title?").
- **Modals**: X or Escape cancels without saving. Clicking the backdrop does _not_ close the modal.

## 4. Main user workflows

1. **Log in**: open http://localhost:5173, enter a username and password from `users.json`, then press Login or Enter.
2. **Create a bug**: click New Bug, fill in Title, Severity, Owner and Description, then click Save. The bug appears on the board as Open.
3. **Find a bug**: type in the search field, click a column header to sort, or switch Open/Closed.
4. **Edit or close a bug**: click its row, change fields (for example State → Closed), then click Save.
5. **Delete a bug**: click its row, click Delete, then click Delete again to confirm.
6. **Log out**: click Logout in the title bar. You return to `/login`, and Back won't restore the session.

## 5. Resetting data

There's no reset script or endpoint.

- **Bugs**: stop `npm run dev`, delete `backend/data/buggyboard.db`, and start again. An empty database is created. The file is gitignored.
- **One bug at a time**: `curl -X DELETE http://localhost:5173/api/bugs/<id>`. No login is needed.
- **Users**: edit `users.json` by hand, or `git checkout users.json` to restore the two defaults.
- **Browser session**: log out, or clear `localStorage["buggyboard_user"]`.

## 6. Documentation in the project

- `README.md`: quickstart, features, tech stack.
- `specs/`: spec-driven development docs, with `constitution.md` as the top-level guide.
  - `product/`: vision, glossary, braindump.
  - `design/`: theme (Volkswagen Beetle colors and UI rules).
  - `engineering/`: tech stack, coding standards, API conventions, development process, Gherkin standards, test-automation patterns (page objects in `tests/pages/`, atomic tests, Arrange-Act-Assert), CI pipelines.
  - `features/01-13`: one spec per feature with user story, design and Gherkin acceptance criteria. These are the best source for test cases.
  - `PROGRESS.md`: per-feature completion checklist.
  - `wireframes.png`.
- AI agent instructions: `CLAUDE.md`, `.cursor/rules/read-specs.mdc`, `.github/copilot-instructions.md`.
- `.devcontainer/devcontainer.json`: Codespaces setup.

## 7. Testing

- `npx playwright test` runs everything: UI tests on Chromium, Firefox and WebKit, and API and data tests once in a browserless `api` project. Each full run is archived to `test-history/` for the quality report.
- Page objects are in `tests/pages/` and fixtures in `tests/fixtures/`. `tests/seed.spec.ts` is the logged-in starting point for planning.
- Test plans live in `specs/testing/`; the `*-plan.spec.ts` files were generated from them with `/playwright-cli`.
- Known defects are pinned with `test.fail`, so the suite stays green until one is fixed.
- `/quality-run` runs the six testing agents in `.claude/agents/` as a team and rebuilds `quality-report/`.
- Healing a failing test: read its `error-context.md` (the locator it waited for and a page snapshot). If the snapshot was taken too late to help, re-run the test with `--debug=cli`, attach `/playwright-cli`, pause before the failing line and read the live page. Fix a script defect in the page object; for an intentional app change, update the page object and the spec.
