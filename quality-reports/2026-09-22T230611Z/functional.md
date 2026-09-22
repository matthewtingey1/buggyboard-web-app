# Functional report: 2026-09-22T230611Z

**Verdict:** ready-with-known-risk. **Confidence:** high (Chromium only).

Candidate: working tree (baseline origin/main cce584c). `/api/health` returned `BuggyBoard API is running`.

What I ran:

- Last run's 86 functional tests (`evidence/functional/prev`): **86/86 passed**. I changed the page object for the new rows (`tbody tr` with a title button) and made the header buttons exact.
- Last run's 26 gap tests (`evidence/functional/gaps`): **26/26 passed**.
- 14 new tests for scenarios this diff could break (`gaps/specs/diff-regressions.spec.ts`): **6 passed, 8 failed** (functional-08, -09, -10).
- Shipped title-bar, session, logout, create-bug and search tests with a bug titled "New Bug Logout Clear search" on the board: **33/33 passed**.
- `zw-save-probe.mjs`: what happens when you save a zero-width field.

## Previous findings

| id | now | how established |
|---|---|---|
| functional-01 search `login` vs `log-in` | **fixed** | prev 11-S3 and 11-S3c pass; the shipped test is no longer `test.fail`. The fix caused functional-10 |
| functional-02 no product coverage | fixed (still) | tests/ covers features 01-13 |
| functional-03 empty board / all-open | gap (still) | shared DB; `noBugsMessage` is used only to assert it is absent on a load error |
| functional-04 create modal resets after paint | **fixed** | gaps functional-04 and C1.5 pass; `useLayoutEffect` |
| functional-05 non-exact Logout/New Bug locators | **fixed** | collision run 33/33 |
| functional-06 weak shipped assertions | **fixed** | users-file checks the password; the delete-cancel test checks the board row |
| functional-07 test-plan gap rows unguarded | gap, narrowed | every listed plan row is now in `tests/*-plan.spec.ts`. Still unguarded: sort across a state switch and after clearing search, and query-side punctuation |

## New findings

| id | title | severity | status |
|---|---|---|---|
| functional-08 | Escape does not close the create or edit modal when focus is on the Severity or State dropdown | medium | confirmed |
| functional-09 | The edit modal enables Save for a zero-width-only field; the server then rejects it | low | confirmed |
| functional-10 | Search regression: `log in` no longer finds `log-in`, and `save load` no longer finds `save/load` | low | confirmed |

**functional-08.** The new guard is `CreateBugModal.tsx:63` and `EditBugModal.tsx:85`:

```ts
if (e.key !== "Escape" || loading || (e.target as HTMLElement | null)?.tagName === "SELECT") return;
```

After you choose a severity or state, focus stays on the closed select, so Escape stops closing the modal. Specs 06 and 09 say Escape acts like Cancel. `tests/accessibility/accessibility.spec.ts:62` asserts the non-spec behaviour.

**functional-09.** The backend and the create modal now count zero-width-only values as blank. The edit modal's `hasBlank` (`EditBugModal.tsx:123`) only trims, so Save is enabled, the PUT returns 400, and the modal shows "Description is required.". Nothing is persisted.

**functional-10.** `normalizeForSearch` now deletes punctuation, so `save/load` becomes `saveload`. The spec example passes, but queries the baseline matched now fail. Fix: strip punctuation and whitespace together on both sides.

## Scenario inventory

`prev/` = the carried-forward suite; `gaps/` = gap and diff-regression tests; `tests/` = the shipped suite (green in the lead's run).

| Feature | Scenario | Status | Evidence |
|---|---|---|---|
| 01 favicon | `/favicon.ico` referenced and served | pass | prev 01-AC1; tests/favicon |
| 01 favicon | Art style | not exercised (visual branding) | - |
| 02 accounts | users.json at root, fields, unique, default buggy/1970beetle | pass | prev 02-AC1..4; tests/user-accounts |
| 03 login | Page shows logo, username, masked password, button | pass | prev 03-S1 |
| 03 login | Unauthenticated redirect (/board, /, unknown) | pass | prev 03-S2 x3 |
| 03 login | Valid login (buggy, vanny, matt) | pass | prev 03-S3/b/c |
| 03 login | Outline: Enter submits from either field | pass | prev 03-S4 x2 |
| 03 login | Invalid username / password: generic error | pass | prev 03-S5, S6 (1 failed login for buggy) |
| 03 login | Blank username / password / both | pass | prev 03-S7..S9 |
| 03 login | Username trimmed | pass | prev 03-S10 |
| 03 login | Authenticated /login redirects to /board | pass | prev 03-S11 |
| 03 login | Session persists across reload | pass | prev 03-S12; collision run |
| 04 title bar | Logo in rounded box, title to its right, logout right-justified | pass | prev 04-AC1; tests/title-bar (collision run) |
| 05 logout | Logout clears auth and redirects | pass | prev 05-S1 |
| 05 logout | /board after logout redirects | pass | prev 05-S2 |
| 05 logout | Back after logout does not restore the session | pass | prev 05-S3 |
| 05 logout | Protected page via Back redirects | pass | prev 05-S4 |
| 06 create | Modal opens with all fields and Save/Cancel | pass | prev 06-S1 |
| 06 create | Owner defaults to current user | pass | prev 06-S2; gaps functional-04 (now clean from first frame) |
| 06 create | Save persists and closes | pass | prev 06-S3 |
| 06 create | Cancel / X do not save | pass | prev 06-S4, S5 |
| 06 create | Escape does not save and closes | **fail** when focus is on Severity (functional-08); pass from text fields | prev 06-S6; diff-regressions '06 Escape after choosing a severity' |
| 06 create | Backdrop keeps modal and data | pass | prev 06-S7 |
| 06 create | Blank fields blocked, required named | pass | prev 06-S8; diff-regressions zero-width title |
| 06 create | Outline: blank title / owner / description | pass | prev 06-S9 x3 |
| 06 create | Outline: blank severity | pass (no blank option; API 400) | prev 06-S9 |
| 06 create | Selected severity colour-coded | pass | prev 06-design |
| 07 board | Columns in order | pass | prev 07-S1 |
| 07 board | One row per bug with its data | pass (own bugs only) | prev 07-S2 |
| 07 board | Empty table when no bugs | not exercised (functional-03) | - |
| 07 board | Severity in caps | pass | prev 07-S4 |
| 08 severity | HIGH/MID/LOW tokens, tint, custom properties, distinct | pass | prev 08-*; tests/board-severity |
| 09 edit | Row click opens "Edit bug #id" with data and buttons | pass | prev 09-S1; diff-regressions: ID, Severity and Owner cells open it too |
| 09 edit | ID read-only, others editable | pass | prev 09-S2 |
| 09 edit | Severity dropdown and colours | pass | prev 09-S3 |
| 09 edit | Backdrop keeps modal and edits | pass | prev 09-S4 |
| 09 edit | Save persists and closes | pass | prev 09-S5 |
| 09 edit | Cancel / X discard | pass | prev 09-S6, S7 |
| 09 edit | Escape discards and closes | **fail** when focus is on Severity or State (functional-08); pass from text fields | prev 09-S8; diff-regressions '09 Escape...', '09/13 Escape...' |
| 09 edit | Save disabled with no changes | pass | prev 09-S9/b |
| 09 edit | Save disabled when a field is blank | pass for empty and whitespace; **fail** for zero-width-only (functional-09) | prev 09-S10 x3; diff-regressions zero-width x3 |
| 10 sort | Default Severity desc, single arrow | pass | prev 10-S1 |
| 10 sort | New column asc; toggle desc; one active column | pass | prev 10-S2..S4 |
| 10 sort | Severity asc = LOW, MID, HIGH; desc = HIGH, MID, LOW | pass | prev 10-S5, S6 |
| 10 sort | All four columns both ways | pass | prev 10-S7 x4 |
| 11 search | Blank shows all, no message, no X | pass | prev 11-S1 |
| 11 search | Typing filters by title | pass for the spec example; **fail** for `log in` and `save load` (functional-10) | prev 11-S2; diff-regressions 11 x2 |
| 11 search | `login` matches `Login fails` and `Issue with log-in` | **pass** (functional-01 fixed) | prev 11-S3, 11-S3c |
| 11 search | Case and whitespace normalised | pass | prev 11-S3b |
| 11 search | X clears and resets | pass | prev 11-S4; diff-regressions |
| 11 search | Sort preserved while searching | pass | prev 11-S5 |
| 11 search | No-match message | pass | prev 11-S6 |
| 12 delete | Edit modal shows Delete | pass | prev 12-S1 |
| 12 delete | Confirmation names id and title, Delete/Cancel | pass | prev 12-S2 |
| 12 delete | Confirm removes and closes both modals | pass | prev 12-S3 |
| 12 delete | Cancel leaves bug intact and on the board | pass | prev 12-S4; gaps 12-S4 |
| 13 state | New bug Open, no State field | pass | prev 13-S1 |
| 13 state | Edit shows state, change persists | pass | prev 13-S2 |
| 13 state | Filter defaults to Open, visibly selected | pass | prev 13-S3 |
| 13 state | Closed shows only closed | pass | prev 13-S4 |
| 13 state | Sorting within state | pass | prev 13-S5; diff-regressions (kept across switch and clear) |
| 13 state | Search and state combine | pass | prev 13-S6 |
| 13 state | No-match message when the state has no bugs | pass via proxy; exact precondition not exercised (functional-03) | prev 13-S7 |

## Evidence

All under `evidence/functional/`:

- `prev-run-log.txt`, `gaps-run-log.txt`, `diff-run-log.txt`
- `suite-locator-collision-log.txt`
- `zw-save-probe.mjs`, `zw-save-probe.txt`, `zw-save-probe.png`
- `test-results/diff/*/test-failed-1.png` and `trace.zip` for every failure

Cleanup: 0 `[functional]` bugs left. The collision probe was deleted (204). Failed logins: one for buggy (prev 03-S6), plus blank-field attempts.

## Not established

- Firefox and WebKit were not run.
- Escape with the native select popup actually open: headless cannot open it, so I could not check the case the guard was written for.
- Empty board: shared DB.
- Visual judgements: favicon art and HIGH prominence.
- Search performance.
- The new resilience behaviours (cross-tab logout, stale click, load error, 404 refresh) are guarded by tests/resilience and delete-bug-plan 3.1. I did not re-measure them.
