# Functional report: 2026-09-22T222029Z

**Verdict:** ready-with-known-risk. **Confidence:** high (Chromium only).

The candidate is the working tree (baseline origin/main cce584c). Health returned `BuggyBoard API is running`. No application code changed apart from the backend port. What I ran:

- The previous run's 86 functional tests again (`evidence/functional/prev`). 84 passed. The 2 failures are functional-01. Two first-run failures were harness-only (users.json path depth and the redacted matt password) and pass after the fix.
- 26 new scratch tests for the test-plan gaps and for spec clauses the suite misses (`evidence/functional/gaps`). 24 passed. The 2 failures are functional-04.
- tests/title-bar, tests/login/session.spec.ts, tests/logout and tests/create-bug against a board holding a bug titled "New Bug Logout". 20 of 26 failed (functional-05).

## Previous findings

| id | status now | how established |
|---|---|---|
| functional-01 search `login` vs `log-in` | still reproduces (confirmed, high) | prev 11-S3 and 11-S3c fail. Shipped `tests/search` pins it with `test.fail`, which records the defect but does not cover the fix |
| functional-02 no product coverage in tests/ | fixed | tests/ now covers features 01-13 with a POM suite |
| functional-03 empty board / all-open not runnable | still a gap | shared DB. The suite's comments say so too |
| functional-04 create modal resets after paint | still reproduces (hardening, low) | gaps `functional-04` and `C1.5`. The first read after reopening shows the stale draft (Title "stale draft", Owner "") |

## New findings

| id | title | severity | status |
|---|---|---|---|
| functional-05 | BoardPage `Logout` / `New Bug` locators are not exact and match bug rows, so 20 tests fail when such a title exists | medium | confirmed |
| functional-06 | Two shipped tests assert less than they claim (default buggy password; board row after cancelling delete) | low | gap |
| functional-07 | The test-plan "❌ gap" rows behave correctly but nothing in tests/ guards them | low | gap |

Fix for functional-05, in `tests/pages/board-page.ts:44-45`:

```ts
this.newBugButton = this.header.getByRole('button', { name: 'New Bug', exact: true });
this.logoutButton = this.header.getByRole('button', { name: 'Logout', exact: true });
```

I saw it happen without trying: an exploratory agent's bug "[exploratory] R03 after-logout ..." was on the board and broke 4 shipped tests. The lead's 410/0 depends on no such title existing at the time of the run.

## Scenario inventory

Test references: `prev/` = the re-run of last run's suite; `gaps/` = new this run; `tests/` = the shipped suite, read and passing in the lead's run.

| Feature | Scenario | Status | Evidence |
|---|---|---|---|
| 01 favicon | `/favicon.ico` referenced and served | pass | prev 01-AC1; tests/favicon |
| 01 favicon | Art style | not exercised (visual branding) | - |
| 02 accounts | users.json at root, fields, unique, default buggy/1970beetle | pass | prev 02-AC1..4. The shipped test skips the password (functional-06) |
| 03 login | Page shows logo, username, masked password, button | pass | prev 03-S1; tests/login |
| 03 login | Unauthenticated redirect (/board, /, unknown) | pass | prev 03-S2 x3 |
| 03 login | Valid login (buggy, vanny, matt) | pass | prev 03-S3/b/c |
| 03 login | Outline: Enter submits from either field | pass | prev 03-S4 x2 |
| 03 login | Invalid username / password: generic error | pass | prev 03-S5, S6 |
| 03 login | Blank username / password / both | pass | prev 03-S7..S9 |
| 03 login | Username trimmed | pass | prev 03-S10 |
| 03 login | Authenticated /login redirects to /board | pass | prev 03-S11 |
| 03 login | Session persists across reload | pass | prev 03-S12 (fails only when a "Logout" title is present; functional-05) |
| 04 title bar | Logo in rounded box, title right of it, logout right-justified | pass | prev 04-AC1; tests/title-bar |
| 05 logout | Logout clears auth, redirects | pass | prev 05-S1 |
| 05 logout | /board after logout redirects | pass | prev 05-S2 |
| 05 logout | Back after logout does not restore session | pass | prev 05-S3 |
| 05 logout | Landing on a protected page via Back redirects | pass | prev 05-S4 |
| 06 create | Modal opens with all fields and Save/Cancel | pass | prev 06-S1 |
| 06 create | Owner defaults to current user | pass (hardening: functional-04) | prev 06-S2; gaps functional-04 |
| 06 create | Save persists and closes | pass | prev 06-S3 |
| 06 create | Cancel / X / Escape do not save | pass | prev 06-S4..S6 |
| 06 create | Backdrop keeps the modal and its data | pass | prev 06-S7 |
| 06 create | Blank fields blocked, required fields named | pass | prev 06-S8; gaps 06-S8 (Title alone gives only "Title is required.") |
| 06 create | Outline: blank title / owner / description | pass | prev 06-S9 x3 |
| 06 create | Outline: blank severity | pass (no blank option; API 400) | prev 06-S9 |
| 06 create | Selected severity colour-coded | pass | prev 06-design |
| 07 board | Columns in order | pass | prev 07-S1 |
| 07 board | One row per bug with its data | pass (own bugs only) | prev 07-S2 |
| 07 board | Empty table when no bugs | not exercised (functional-03) | - |
| 07 board | Severity in caps | pass | prev 07-S4 |
| 08 severity | HIGH/MID/LOW exact tokens, tint, custom properties, distinct | pass | prev 08-*; tests/board-severity |
| 09 edit | Row opens "Edit bug #id" with data and buttons | pass | prev 09-S1 |
| 09 edit | ID read-only, others editable | pass | prev 09-S2 |
| 09 edit | Severity dropdown and colours | pass | prev 09-S3 |
| 09 edit | Backdrop keeps modal and edits | pass | prev 09-S4 |
| 09 edit | Save persists and closes | pass | prev 09-S5; gaps E2.3 (Enter in Title saves) |
| 09 edit | Cancel / X / Escape discard | pass | prev 09-S6..S8 |
| 09 edit | Save disabled with no changes | pass | prev 09-S9/b; gaps E3.4 (trailing space only) |
| 09 edit | Save disabled when a field is blanked | pass | prev 09-S10 x3 |
| 10 sort | Default Severity desc, single arrow | pass | prev 10-S1 |
| 10 sort | New column asc; toggle desc; one active column | pass | prev 10-S2..S4 |
| 10 sort | Severity asc = LOW, MID, HIGH; desc = HIGH, MID, LOW | pass | prev 10-S5, S6 |
| 10 sort | All four columns both ways | pass | prev 10-S7 x4 |
| 11 search | Blank search shows all, no message, no X | pass | prev 11-S1 |
| 11 search | Typing filters by title | pass | prev 11-S2 |
| 11 search | `login` matches `Login fails` and `Issue with log-in` | **fail** (functional-01) | prev 11-S3, 11-S3c; screenshots in test-results/prev/11-search-* |
| 11 search | Case and whitespace normalised | pass | prev 11-S3b; gaps (bracket punctuation) |
| 11 search | X clears and resets | pass | prev 11-S4; gaps (sort kept after clearing) |
| 11 search | Sort preserved while searching | pass | prev 11-S5 |
| 11 search | No-match message | pass | prev 11-S6 |
| 12 delete | Edit modal shows Delete | pass | prev 12-S1 |
| 12 delete | Confirmation names id and title, has Delete/Cancel | pass | prev 12-S2; gaps D1.3 (Escape closes only the confirmation), D1.4 (backdrop keeps it open) |
| 12 delete | Confirm removes the bug and closes both modals | pass | prev 12-S3; gaps D2.3 (from Closed, view kept) |
| 12 delete | Cancel leaves the bug intact and on the board | pass | prev 12-S4; gaps 12-S4 (board row; the shipped test skips it, functional-06) |
| 13 state | New bug Open, no State field | pass | prev 13-S1; gaps C6.1 (created from Closed view) |
| 13 state | Edit shows state, change persists | pass | prev 13-S2 |
| 13 state | Filter defaults to Open, visibly selected | pass | prev 13-S3 |
| 13 state | Closed shows only closed | pass | prev 13-S4 |
| 13 state | Sorting within state | pass | prev 13-S5; gaps (sort kept across a state switch) |
| 13 state | Search and state combine | pass | prev 13-S6; gaps (search kept across a state switch) |
| 13 state | No-match message when the state has no bugs | pass via proxy; exact precondition not exercised (functional-03) | prev 13-S7 |

Test-plan gap rows, all passing in `gaps/`:

- create: 1.2, 1.3, 2.4, 2.5, 2.6, 4.4, 5.1, 5.2, 6.1, 6.2
- edit: 1.2, 2.3, 2.4, 3.4, 5.1 (UI shows "Bug not found." and nothing is recreated)
- delete: 1.3, 1.4, 2.3

Create 1.5 fails, which is functional-04.

## Suite assertion spot-check

I read every UI spec under the folders named in the dispatch. Most tests assert what their titles say, scope data to their own token, and never count totals. The exceptions:

- The two weak assertions in functional-06.
- The data-dependent locators in functional-05.
- The bug-status no-match test is a proxy, and says so in a comment.
- `test.fail` guards (search `log-in`) are known defects, not coverage.

## Evidence

- `evidence/functional/prev/`: the re-run suite. Logs are `prev-run-log.txt` and `prev-rerun-log.txt`.
- `evidence/functional/gaps/`: the gap specs, fixtures and config. Log is `gaps-run-log.txt`.
- `evidence/functional/suite-locator-collision-log.txt`: functional-05.
- `evidence/functional/test-results/`: screenshots and traces for every failure.
- Cleanup: 0 `[functional]` bugs left. Probe bug 3309 was deleted (204).

## Not established

- Firefox and WebKit were not run; only Chromium was available (`--workers=1`).
- Counts and totals were never asserted, because other agents change data concurrently.
- The favicon art and "HIGH more prominent" were not judged visually.
- Search performance was not measured.
- Test-plan rows marked "fails today" belong to other agents and were not re-measured.
- I did not re-run the full shipped suite; that belongs to the lead.
