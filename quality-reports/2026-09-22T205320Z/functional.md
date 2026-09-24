# Functional report: 2026-09-22T205320Z

**Verdict:** ready-with-known-risk. **Confidence:** high (Chromium only).

The candidate is the working tree (baseline origin/main cce584c). Health returned `BuggyBoard API is running`. I ran 86 atomic UI tests in headless Chromium with 1 worker: 84 pass and 2 fail, and both failures have the same cause, functional-01. The diff slice holds: the new user `matt` / `<redacted>` logs in, `buggy` and `vanny` still log in, and the API works through the vite proxy to port 3002. The failing search behaviour is not part of this diff; it is also on the baseline.

No feature in `specs/features/` has automated coverage in `tests/`. The lead's 6/6 is `tests/example.spec.ts` running against playwright.dev (functional-02).

## Findings

| id | title | severity | status |
|---|---|---|---|
| functional-01 | Search for "login" does not match "Issue with log-in" (punctuation becomes a space instead of being removed) | high | confirmed |
| functional-02 | No feature has automated product coverage in tests/ | medium | gap |
| functional-03 | Empty-board and all-open-board scenarios cannot be run on the shared DB | low | gap |
| functional-04 | Create modal first renders Owner blank and fills the default after paint | low | hardening |

Smallest fix for functional-01, in `frontend/src/BoardPage.tsx:44`: change `lower.replace(/\p{P}/gu, " ")` to `lower.replace(/\p{P}/gu, "")`.

## Scenario inventory

Test IDs refer to `evidence/functional/specs/*.spec.ts`.

| Feature | Scenario | Status | Test |
|---|---|---|---|
| 01 favicon | Favicon is `/favicon.ico` and referenced | pass | 01-AC1 |
| 01 favicon | Art style: tan cartoon 1970 Beetle | not exercised (visual branding; unowned) | - |
| 02 accounts | users.json at root, username+password, unique usernames, default buggy/1970beetle | pass | 02-AC1..4 |
| 03 login | Displays login page (username, masked password, button, logo) | pass | 03-S1 |
| 03 login | Unauthenticated redirect to /login (/board, /, unknown path) | pass | 03-S2 x3 |
| 03 login | Valid login lands on /board (buggy, vanny, matt) | pass | 03-S3, S3b, S3c |
| 03 login | Outline: Enter submits from username / password | pass | 03-S4 x2 |
| 03 login | Invalid username: generic error | pass | 03-S5 |
| 03 login | Invalid password: same generic error | pass | 03-S6 |
| 03 login | Blank username | pass | 03-S7 |
| 03 login | Blank password | pass | 03-S8 |
| 03 login | Blank username and password | pass | 03-S9 |
| 03 login | Username whitespace trimmed | pass | 03-S10 |
| 03 login | Authenticated /login redirects to /board | pass | 03-S11 |
| 03 login | Session persists across reload | pass | 03-S12 |
| 04 title bar | Logo left in rounded box, title right of logo, logout right | pass | 04-AC1 |
| 05 logout | Logout clears auth and goes to /login | pass | 05-S1 |
| 05 logout | /board after logout redirects to /login | pass | 05-S2 |
| 05 logout | Back after logout does not restore session | pass | 05-S3 |
| 05 logout | Landing on protected page via Back redirects to login | pass | 05-S4 |
| 06 create | New Bug opens modal with all fields and Save/Cancel | pass | 06-S1 |
| 06 create | Owner defaults to current user | pass (see functional-04) | 06-S2 |
| 06 create | Save with all fields persists and closes | pass | 06-S3, S3b |
| 06 create | Cancel does not save | pass | 06-S4 |
| 06 create | X does not save | pass | 06-S5 |
| 06 create | Escape does not save | pass | 06-S6 |
| 06 create | Backdrop click keeps modal open, data preserved | pass | 06-S7 |
| 06 create | Blank fields block save and name the required fields | pass | 06-S8 |
| 06 create | Outline: blank title / owner / description | pass | 06-S9 x3 |
| 06 create | Outline: blank severity | pass (UI offers no blank option; API returns 400) | 06-S9 severity |
| 06 create | Design: selected severity is colour-coded in dropdown | pass | 06-design |
| 07 board | Columns ID, Severity, Title, Owner in order | pass | 07-S1 |
| 07 board | One row per bug with its data | pass (own bugs only) | 07-S2 |
| 07 board | Empty table when no bugs | not exercised (shared DB; functional-03) | - |
| 07 board | Severity displayed in all caps | pass | 07-S4 |
| 08 severity | Colour-coded HIGH/MID/LOW with exact hex | pass | 08-S1/S2/S4 |
| 08 severity | HIGH uses the token with a text and tint background | pass | 08-S1/S2/S4 |
| 08 severity | Colours distinct | pass (tokens distinct; "more prominent" is a visual judgement, not asserted) | 08-S3 |
| 08 severity | Styling uses CSS custom properties | pass | 08-S1/S2/S4 |
| 09 edit | Row click opens "Edit bug #id" with all data and buttons | pass | 09-S1 |
| 09 edit | ID read-only, others editable | pass | 09-S2 |
| 09 edit | Severity dropdown HIGH/MID/LOW with board colours | pass | 09-S3 |
| 09 edit | Backdrop click keeps modal and edits | pass | 09-S4 |
| 09 edit | Save persists changes and closes | pass | 09-S5 |
| 09 edit | Cancel discards | pass | 09-S6 |
| 09 edit | X discards | pass | 09-S7 |
| 09 edit | Escape discards | pass | 09-S8 |
| 09 edit | Save disabled with no changes (also after reverting an edit) | pass | 09-S9, S9b |
| 09 edit | Save disabled when title / owner / description blanked | pass | 09-S10 x3 |
| 09 edit | Severity cannot be blanked | pass (no blank option) | 09-S10 severity |
| 10 sort | Default Severity desc, only Severity shows the down arrow | pass | 10-S1 |
| 10 sort | Title click: ascending with up arrow, only Title marked | pass | 10-S2 |
| 10 sort | Title click again: descending | pass | 10-S3 |
| 10 sort | Only one active sort column | pass | 10-S4 |
| 10 sort | Severity asc = LOW, MID, HIGH | pass | 10-S5 |
| 10 sort | Severity desc = HIGH, MID, LOW | pass | 10-S6 |
| 10 sort | All four columns sortable both ways | pass | 10-S7 x4 |
| 11 search | Blank search shows all, no message, no X | pass | 11-S1 |
| 11 search | Typing "login" filters by title | pass (no non-matching titles shown; the missing log-in row is covered by S3) | 11-S2 |
| 11 search | "login" matches "Login fails" and "Issue with log-in" | **fail** (functional-01) | 11-S3, 11-S3c |
| 11 search | Case and whitespace normalised | pass | 11-S3b |
| 11 search | X clears and resets | pass | 11-S4 |
| 11 search | Sort preserved while searching | pass | 11-S5 |
| 11 search | No-match message and no rows | pass | 11-S6 |
| 13 state | New bug is Open, no State field in New Bug modal, listed under Open | pass | 13-S1 |
| 13 state | Edit modal shows state, change persists | pass | 13-S2 |
| 13 state | Filter defaults to Open, visibly selected, hides closed | pass | 13-S3 |
| 13 state | Closed shows only closed | pass | 13-S4 |
| 13 state | Sorting within the selected state | pass | 13-S5 |
| 13 state | Search and state filter combine | pass | 13-S6 |
| 13 state | No-match message when the state has no bugs | pass via proxy (Closed + own open-only token); exact precondition not exercised (functional-03) | 13-S7 |

## Evidence

- Suite: `evidence/functional/specs/`, page objects in `evidence/functional/pages/`, config `evidence/functional/playwright.functional.config.ts`
- Full run log: `evidence/functional/run-log.txt` (84 passed, 2 failed)
- Failure screenshots and traces: `evidence/functional/test-results/11-search-*/`
- Owner-prefill probe: `evidence/functional/probe-owner-prefill.mjs`
- Cleanup: 0 `[functional]` bugs left in the DB after the run

## Not established

- Firefox and WebKit were not run; only Chromium was available (`--workers=1`).
- No counts or totals were asserted, because other agents write to the same DB. Every data assertion is scoped to bugs this run created, using a unique token.
- The favicon art style and the "HIGH more prominent" visual judgement were not assessed.
- Filter-as-you-type performance was not measured.
