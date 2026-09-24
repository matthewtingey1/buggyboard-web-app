# Progress

Checklists are updated as each feature is completed. After each feature, the AI pauses for human review.

---

## Project setup

- [x] Repo structure (frontend + backend)
- [x] Dependencies (Node, TypeScript, React, Tailwind, Express; SQLite when needed)
- [x] Linting and formatting
- [x] Run scripts (dev, build, etc.)

---

## Feature: Favicon (01-favicon.md)

- [x] Spec written in `specs/features/`
- [x] Backend implemented (N/A – frontend only)
- [x] Frontend implemented
- [x] Linter/errors resolved

---

## Feature: User accounts – data only (02-user-accounts.md)

- [x] Spec written in `specs/features/`
- [x] Backend implemented (users.json + users module; no auth yet)
- [x] Frontend implemented (N/A – data only)
- [x] Linter/errors resolved

---

## Feature: Login (03-login.md)

- [x] Spec written in `specs/features/`
- [x] Backend implemented (authService, POST /api/login)
- [x] Frontend implemented (router, auth, login page with password masking, board page)
- [x] Specs: api-conventions.md (API path prefix)
- [x] Linter/errors resolved

---

## Feature: Title bar (04-title-bar.md)

- [x] Spec written in `specs/features/`
- [x] Backend implemented (N/A – frontend only)
- [x] Frontend implemented (TitleBar with logo, title, logout; BoardPage layout)
- [x] Linter/errors resolved

---

## Feature: Logout (05-logout.md)

- [x] Spec written in `specs/features/`
- [x] Backend implemented (N/A – frontend only)
- [x] Frontend implemented (logout button in TitleBar, auth.logout(), ProtectedRoute redirect; all four scenarios satisfied)
- [x] Linter/errors resolved

---

## Feature: Create bug (06-create-bug.md)

- [x] Spec written in `specs/features/`
- [x] Backend implemented (bugs table, bugService, POST /api/bugs)
- [x] Frontend implemented (Create bug button, CreateBugModal with title/severity/owner/description, validation, save/cancel)
- [x] Linter/errors resolved

---

## Feature: Bug board (07-bug-board.md)

- [x] Spec written in `specs/features/`
- [x] Backend implemented (listBugs, GET /api/bugs)
- [x] Frontend implemented (BoardPage table: ID, Severity, Title, Owner; severity in caps; refresh on create)
- [x] Linter/errors resolved

---

## Feature: Board severity color-coding (08-board-severity.md)

- [x] Spec written in `specs/features/`
- [x] Backend implemented (N/A – frontend only)
- [x] Frontend implemented (CSS custom properties for severity colors; severity badges on board with text + tint)
- [x] Linter/errors resolved

---

## Feature: Edit bug (09-edit-bug.md)

- [x] Spec written in `specs/features/`
- [x] Backend implemented (getBug, updateBug, GET /api/bugs/:id, PUT /api/bugs/:id)
- [x] Frontend implemented (click row opens EditBugModal; ID read-only, Save/Cancel, Save disabled when no changes or blank; backdrop does not close)
- [x] Linter/errors resolved

---

## Feature: Sort board columns (10-sort-board-columns.md)

- [x] Spec written in `specs/features/`
- [x] Backend implemented (N/A – client-side sort)
- [x] Frontend implemented (default Severity desc; clickable headers; arrow indicators; severity LOW→MID→HIGH / HIGH→MID→LOW)
- [x] Linter/errors resolved

---

## Feature: Search board (11-search-board.md)

- [x] Spec written in `specs/features/`
- [x] Backend implemented (N/A – client-side filter)
- [x] Frontend implemented (search in title bar left of New Bug; live filter by title; case insensitive, collapse whitespace, normalize punctuation; X clear; sort preserved; no-results message)
- [x] Linter/errors resolved

---

## Feature: Delete bug (12-delete-bug.md)

- [x] Spec written in `specs/features/`
- [x] Backend implemented (deleteBug, DELETE /api/bugs/:id)
- [x] Frontend implemented (Delete button in Edit bug modal; removes bug, closes modal, board refreshes)
- [x] Linter/errors resolved

---

## Feature: Bug status (13-bug-status.md)

- [x] Spec written in `specs/features/`
- [x] Backend implemented (state column OPEN/CLOSED; createBug sets OPEN; updateBug/getBug/listBugs include state; PUT accepts state)
- [x] Frontend implemented (state filter toggle above board default Open; Edit modal State dropdown; search + sort apply with state filter; no-bugs-matched message)
- [x] Linter/errors resolved

---

## Test automation (Playwright, POM)

- [x] Fixtures, page objects and a self-cleaning bug API helper (`tests/fixtures/`, `tests/pages/`)
- [x] Favicon and user accounts (01, 02): `tests/favicon/`, `tests/user-accounts/`
- [x] Login (03): `tests/login/`
- [x] Title bar and logout (04, 05): `tests/title-bar/`, `tests/logout/`
- [x] Create bug (06): `tests/create-bug/`
- [x] Bug board and severity (07, 08): `tests/bug-board/`, `tests/board-severity/`
- [x] Edit bug (09): `tests/edit-bug/`
- [x] Sort (10): `tests/sort/`
- [x] Search (11): `tests/search/`. The punctuation scenario is marked `test.fail` until the defect is fixed.
- [x] Delete bug (12): `tests/delete-bug/`
- [x] Bug status (13): `tests/bug-status/`
- [x] API contract and data round-trip (`api` project, runs once): `tests/api/`, `tests/data/`
- [x] Security and accessibility guards: `tests/security/`, `tests/accessibility/` (Chromium only)
- [x] Run archive for the quality report: `tests/reporters/archive-reporter.ts` → `test-history/`
- [x] Seed spec (`tests/seed.spec.ts`) and test plans (`specs/testing/`) for create, edit and delete
- [x] Plan-generated tests with `/playwright-cli`: `tests/*/*-plan.spec.ts`; every gap row in the plans is automated
- [x] Suite fixes from quality run 2026-09-22T222029Z: self-cleaning `bugApi`, exact header locators, stronger assertions
- Known defects are pinned with `test.fail`; each one reports an unexpected pass once fixed.
- Not automated: the empty-board scenario (07) needs an empty database; the favicon art style (01) is a visual judgement.

---

## Quality fixes (2026-09-22, from quality runs 1 and 2)

- [x] Search removes punctuation (`login` matches `log-in`)
- [x] API: strict ids, JSON errors without stack traces, 405/415/413 in JSON, typed fields, `invalid_severity`, stored rows returned, zero-width values rejected, one-line titles
- [x] API: login rate limit, loopback-only binding, no `X-Powered-By`, basic security headers
- [x] Modals: no stale first frame, no double submit, Escape ignored during save and inside a `<select>`, focus trapped and returned, confirmation takes focus
- [x] Board: real table rows with a title button, `aria-pressed` filter, status announcements, load-error state, stale responses ignored, dead rows refreshed, header reflows
- [x] Login: `main` and heading, per-route titles, focus kept on error, `aria-invalid`
- [x] Auth follows logout and user switches across tabs
- [x] Run-3 follow-ups: login limiter keyed on client and exact username with bounded memory and `Retry-After`; Host-header check; 405/404 before 415; `invalid_type`; wider blank and one-line rules; Escape acts like Cancel on dropdowns again (spec); search reads punctuation both ways; header Close disabled while saving; visible row-open errors; ordered refreshes; New Bug cancels a pending row open; held Enter and drag-select ignored; Cancel focus rings, Edit blank-field hint, focus after a failed save, scrollable table region, repeated announcements
- [x] Heal-tests exercise (script break and app-contract break), evidence in `quality-reports/2026-09-22T230611Z/evidence/lead/heal/`
- [ ] Open decisions: API authentication, concurrent edits, field length limits, owner rules, severity badge contrast (theme colours), whitespace-only passwords, Escape inside an open native dropdown

---

_(Add one section per feature; copy the checklist template above.)_
