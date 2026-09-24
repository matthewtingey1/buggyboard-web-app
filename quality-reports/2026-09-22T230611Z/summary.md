# BuggyBoard quality run 2026-09-22T230611Z

## Verdict

**Not ready.** Confidence: high. What still blocks release is two product decisions, not open defects in what was built: API authentication and conflict handling on concurrent edits. Every other high finding from this run is fixed.

This run tested the first candidate with application fixes (the backend and frontend diff against `origin/main`, cce584c). All six reports were delivered, and every agent carried forward each previous finding. The lead ran the full suite three times, after a first attempt that failed on LEAD-06 (below):

| Run | Tests | Passed | Skipped | Failed |
|---|---|---|---|---|
| Before dispatch | 528 | 504 | 24 | 0 |
| After the post-run fixes and the heal exercise | 559 | 531 | 28 | 0 |
| Final, with the Host-header guards | 561 | 533 | 28 | 0 |

All three runs are archived. Skipped tests are the Chromium-only accessibility specs. No `[slug]` or `[e2e]` rows remain.

**Blocking**
- **security-01 (critical):** anonymous access to every `/api/bugs` verb. Exposure is narrower now (loopback bind, Host check, 415), but there is still no authentication.
- **security-02 (high):** the session is a forgeable localStorage value.
- **exploratory-01 (high reading):** lost update on concurrent edit (C1).

The two security findings are the product's open **authentication** decision. exploratory-01 is the **spec 09 conflict-handling** decision. Each is pinned in `tests/` with `test.fail`, where applicable.

**Fixed since run 2026-09-22T222029Z (confirmed by the agents this run):** 47 findings.
- functional-01 (search punctuation).
- The three medium contract breaks (contract-01, 02, 03), plus contract-05 and 06.
- Data: data-01, 02, 03, 05, 06, 09.
- Security: security-04 through 09, including the stack traces, bind address and headers.
- Accessibility: 19 of 23 a11y findings, including all three highs.
- Exploratory: exploratory-02, 03, 04, 06, 09, 11.

**Regressions the fixes introduced, found by this run and fixed after it (LEAD-04).** Each is verified by a guard that fails with the fix disabled and passes with it:
- **functional-08:** my Escape-in-dropdown rule broke specs 06 and 09 ("Escape acts like Cancel"). Reverted to the spec, which reopens a11y-19 as potential (LEAD-05).
- **functional-10:** removing punctuation broke "log in" and "save/load" queries. Search now tries both readings.
- **security-14 (high), folded with exploratory-16:** the new login limiter let anyone lock anyone out. It is now keyed on client plus exact username, bounded in memory (security-15), and sends `Retry-After`.
- **Also fixed after the run:**
  - functional-09 and data-12 (edit Save with zero-width values)
  - data-10
  - data-11 and contract-15 (invisible characters and U+2028)
  - contract-04, 13, 14 and 16
  - security-17 (DNS rebinding: Host check)
  - exploratory-10, 12, 14, 15, 18 and 19
  - a11y-11, 20, 24, 25 and 26

  These are verified by lead guard tests only; the next run should re-confirm them independently.

**Suite defect found by the lead before dispatch (LEAD-06, fixed).** The invalid-login tests shared one fixed unknown username. It never logged in successfully, so its failures accumulated across runs until the new limiter locked it, and the first lead run failed on it. Each test now uses a unique username. The failed log is kept as `evidence/lead/full-suite-first-attempt.txt`.

**Heal-tests exercise.** Evidence is in `evidence/lead/heal/`.
1. **Script break:** the `savingButton` locator was changed to `Saving...`. Two tests failed. The error context's snapshot was taken after the save finished, so it could not show the button. The failing test was then paused with `--debug=cli` and `/playwright-cli`, whose live snapshot showed `button "Saving…"`. The locator was healed to match, and all 9 runs passed.
2. **App-contract break:** "New Bug" was renamed to "Report Bug" in `TitleBar.tsx`. 31 tests failed. The error context showed the wait for `button 'New Bug'` against a snapshot containing `button "Report Bug"`, so one page-object edit healed all 39 tests. The label was then restored to "New Bug", because specs 04 and 06 name it, and the final full run passed.

**Open, and not defects in the fixes**
- **Decisions:**
  - a11y-08: severity badge contrast against the theme tokens.
  - security-10: field length limits.
  - contract-07: whitespace-only password.
  - contract-10: missing state reports `invalid_state`.
  - exploratory-07: owner rules.
  - exploratory-17: logout in one tab drops another tab's draft.
  - a11y-19 (LEAD-05): Escape inside an open native dropdown.
- **Gaps:** contract-08 (no written API contract), a11y-01 and security-11 (no requirements), functional-03 and data-08 (need an isolated database or a controlled restart), and functional-07, contract-09 and a11y-27 (narrowed).
- **Hardening:** security-13 (plaintext passwords), security-16 (per-process limiter; no per-client cap because the proxy makes every client one IP), contract-11 (proxy OPTIONS), exploratory-05, 08 and 13, data-04 and data-07.
- **Needs a person:** a real screen reader, Safari, and real 400% zoom and High Contrast.

### Reconciliation

| Surviving | Folded in | Basis |
|---|---|---|
| contract-03 | data-02, security-09 | Id parsing; all three fixed. |
| contract-02 | contract-01, security-06, exploratory-04 | JSON errors; all fixed. |
| security-10 | data-04, exploratory-05, contract-12 | Length limits, a product decision. The HTML-413 half is fixed. |
| data-06 | exploratory-02 | Dead row after a remote delete; fixed. |
| functional-04 | exploratory-09 | Stale first frame; fixed. |
| LEAD-01 | functional-02 | No product coverage; fixed. |
| LEAD-02 | data-09, functional-05, functional-06 | Run-2 suite defects; fixed and re-confirmed. |
| LEAD-04 | 26 run-3 findings (listed in `quality-model.json`) | Fixed after the run; see above. |
| LEAD-05 | a11y-19 | Reopened as potential, because the spec wins over the Escape-in-dropdown rule. |

**A conflict, and who owns it.** functional-08 and a11y-19 want opposite things from Escape on a dropdown. The spec (06, 09) is the authority, so Escape closes the modal. Whether Escape inside an *open* native dropdown list should close it is a question for a headed-browser check and for the spec owner.

**C1, still one observation with two readings.** exploratory-01 and data-07 see last-write-wins. It's a product decision for the owner of spec 09.

**security-12, needs a decision.** The working tree and index are clean of the home path, the OS username and trace zips. The already-pushed commits on the PR branch still contain them, and only a history rewrite with a force-push removes them.

## Merged report

<!-- findings:start -->
_Generated by `quality-summary.js 2026-09-22T230611Z` at 2026-09-22T23:38:52.788Z. Do not hand-edit._

### Agents that reported

| Agent | Verdict | Confidence | Findings | Scope |
|---|---|---|---|---|
| a11y | ready-with-known-risk | medium | 27 | Re-test of all 23 findings from run 2026-09-22T222029Z against the working tree (useDialogFocus, modal, board, title bar and login changes). Then new checks, all headless. Keyboard-only walk in Chromium and Firefox: login (failure uses a throwaway username), board Tab order, Create/Edit/Delete-confirm traps (12 x Tab and 12 x Shift+Tab each), Escape, Close X, validation, the Severity select, save, search and Clear, open a row with Enter and Space, edit twice, close a bug from Edit, delete with confirm and cancel, injected 500s on POST/PUT/DELETE, the Open/Closed toggle, sort headers, logout. ariaSnapshot of every view in both engines; status-region mutations recorded with a MutationObserver; contrast computed from getComputedStyle (26 pairs); reflow at 320x256, 320x640 and 640x900 in both engines; table keyboard scroll at 320; 1.4.12 text spacing; forced-colors emulation; target sizes. Scoped run of tests/accessibility/ (Chromium, 12/12 passed). Every [a11y] bug created was deleted; none remain. |
| contract | ready-with-known-risk | high | 16 | Re-test of contract-01..12 from run 2026-09-22T222029Z, then every endpoint (GET /api/health, POST /api/login, GET/POST /api/bugs, GET/PUT/DELETE /api/bugs/:id) against every input class: valid, each missing field, number/null/array/object/boolean types, blank, whitespace-only, zero-width-only, lowercase/invalid severity and state, non-numeric/missing/<id>abc/negative/zero/leading-zero/huge/percent-malformed ids, malformed and non-object JSON, missing and wrong Content-Type, charset and Content-Encoding, 150-200 KB bodies, HEAD, OPTIONS, wrong methods, unknown and case-variant paths, line separators and invisible characters in titles, login rate limit (throwaway username). 161 probe rows sent through the Vite proxy and again direct to 127.0.0.1:3002 and diffed; header captures for OPTIONS/CORS; scoped run of tests/api (59 tests) and a review of what they assert; frontend error handling read against the new statuses. |
| data | ready-with-known-risk | high | 12 | Re-test of data-01..10 from run 2026-09-22T222029Z, then side effects of the new bugService rules. API (evidence/data/api-retest.mjs): title one-line rule on create and update for LF, CRLF+indent, CR, blank lines, NBSP/tab next to a break, inner NBSP and double space, U+2028, U+0085, VT/FF, ZWJ emoji across a break; owner/description keep their newlines; blank check for 21 invisible or format characters in each field; legitimate ZWJ/ZWNJ/VS16 values and a ZWSP-padded owner; lone surrogates in create and update responses; id parsing; 90k title and 120k description; 20 rounds of parallel full-row PUTs, stale overwrite, 10 PUT\|\|DELETE races, PUT/DELETE after delete, id non-reuse; Open->Closed. Every value compared across the POST/PUT response, GET :id, GET list and a read-only better-sqlite3 connection. UI (headless chromium, evidence/data/ui-retest.mjs): API multi-line title through the edit modal, U+2028 title on the board and in the modal, UI creates with NBSP, bidi isolates, NUL, ZWJ family and flag sequences, space padding (request, response, DB, board, modal), zero-width and LRM titles in the create modal, zero-width title in the edit modal, stale save/delete/row click after another client's delete, 120k description, Closed filter. Suite: tests/data/round-trip.spec.ts with a residue snapshot before and after, a fixture cleanup probe (evidence/data/residue/), and an audit of UI creates that don't register their title. |
| exploratory | ready-with-known-risk | medium | 19 | Re-test of all 13 previous exploratory findings (R01-R13), then 8 new time-boxed charters aimed at the new code, run headless in Chromium against the live app (UI :5173, API via the proxy): N1 the header Close (x) versus the Saving/Deleting lock, N2 a slow row open followed by New Bug (stacked dialogs), N3 out-of-order board refreshes, N4 login lockout by a third party (throwaway usernames only; one wrong-case attempt for buggy followed by a successful login), N5 two tabs with a logout and a user switch mid-draft and mid-save, N6 focus and keyboard (rapid open/close, Enter held, focus return, confirm stacking, Tab trap, Try again), N7 row padding versus the title button, text selection and header wrap at 375/320, N8 one-line titles and invisible characters through the edit form. Latency and failures were simulated with page.route. Every record carried the [exploratory] prefix; 27 were created and all deleted (0 remain). |
| functional | ready-with-known-risk | high | 10 | Every Scenario / Scenario Outline in specs/features/01-13 on the working tree (baseline origin/main cce584c), headless Chromium, 1 worker, http://localhost:5173. Re-ran last run's 86 atomic functional tests (evidence/functional/prev; page object updated for the new row markup: rows are tbody tr with a title button, header buttons exact) and 26 gap tests (evidence/functional/gaps). Added 14 tests (gaps/specs/diff-regressions.spec.ts) for scenarios this diff could break and nothing in tests/ guards: Escape after using a select, zero-width blanks in the edit modal, row clicks on non-title cells, search punctuation variants, sort across state switch plus clear. Re-ran tests/title-bar, tests/login/session.spec.ts, tests/logout, tests/create-bug/create-bug.spec.ts and tests/search with a bug titled 'New Bug Logout Clear search' on the board. One headless node probe for the zero-width Save path. |
| security | not-ready | high | 17 | Re-test of all 13 run-2 findings. Diff slice: backend/src/index.ts (login rate limiter, 127.0.0.1 bind, headers, 415, JSON error handler, typed login fields, strict ids), frontend/vite.config.ts proxy target, frontend/src/auth.tsx cross-tab logout. Anonymous GET/POST/PUT/DELETE; id edge cases on own [security] bugs; typed/malformed/charset/gzip/oversized bodies; response headers direct and via proxy; foreign-origin preflight; Host-header acceptance (DNS rebinding precondition); listeners; rate-limiter design with throwaway usernames only (lockout of an unowned name, case-folded key, spraying 25 names, 200 x 90 KB usernames with RSS before/after); <script>, <svg onload>, <img onerror>, <iframe javascript:> and SQL metacharacters in title, owner, description on board and edit modal; logout replay, cross-tab logout, forged session from a second tab; security-12 redaction in working tree, index and pushed history incl. committed trace.zip contents; npm audit prod and full. Scoped guards: tests/api/auth.spec.ts, tests/security/security.spec.ts. |

### Findings

| # | Status | Severity | Agent | Finding | Requirement | Location |
|---|---|---|---|---|---|---|
| 1 | confirmed | critical | security | Every /api/bugs verb works with no session: anonymous read, create, edit and delete | 03-login.md 'Only users listed in users.json are valid login credentials'; 05-logout.md 'prevent other users from using my credentials'; OWASP A01/A07, ASVS 4.1.1 | backend/src/index.ts:144-241 |
| 2 | confirmed | high | exploratory | Concurrent edits silently overwrite: saving a stale edit modal reverts another user's change (lost update) | Charter C2: two users editing one bug. Vision: every user has full access to all bugs, so concurrent edits are expected, yet no spec says what happens when they collide. | frontend/src/EditBugModal.tsx:160 (PUT sends the whole record); backend/src/bugService.ts:120 (unconditional UPDATE) |
| 3 | confirmed | high | security | Session is a client-side localStorage flag; any string, including a non-existent user, opens the board | 03-login.md 'Only users listed in users.json are valid login credentials'; ASVS 3.1/3.2 | frontend/src/auth.tsx:25-43, frontend/src/ProtectedRoute.tsx |
| 4 | confirmed | high | security | Login lockout is keyed on username alone: any anonymous caller can lock any user out for 15 minutes, repeatably | 03-login.md (a listed user can log in); OWASP A07 / ASVS 2.2.1 note that anti-automation must not enable account denial of service | backend/src/index.ts:85-103 |
| 5 | confirmed | medium | a11y | Severity badge text fails 4.5:1 on its own tint (HIGH 3.77, MID 2.93, LOW 4.32) | WCAG 1.4.3 Contrast (Minimum); spec 08 colours | frontend/src/index.css:8-10,22-33 |
| 6 | confirmed | medium | a11y | Cancel buttons keep a stone-400 focus ring at 2.52:1 | WCAG 1.4.11 Non-text Contrast (2.4.7 relies on it) | frontend/src/CreateBugModal.tsx:239; frontend/src/EditBugModal.tsx:353,402 |
| 7 | confirmed | medium | a11y | At 320 px the Owner column is clipped and Chromium keyboard users cannot scroll to it | WCAG 2.1.1 Keyboard; 1.4.10 Reflow (tables may scroll in 2-D, but the scroll must be operable) | frontend/src/BoardPage.tsx:233 |
| 8 | confirmed | medium | exploratory | The header Close (x) button bypasses the Saving/Deleting lock: a late response closes the next draft, or drops its error into it | Charter N1: slow network during save and delete. Specs 06 and 09 say Escape has the same effect as Cancel. Cancel is disabled while saving, but Escape is not (hand-off to functional for that clause). What a late response does to a newer modal is not specified anywhere. | frontend/src/CreateBugModal.tsx:150-158 (header Close has no disabled={loading}) and 116-122 (a late response acts on whatever draft is open); frontend/src/EditBugModal.tsx:230-238 and 383-391 (Close buttons not disabled while loading/deleting) |
| 9 | confirmed | medium | exploratory | A slow row open followed by New Bug stacks the edit modal over the create modal: typing lands in the other bug's title, and one Escape discards the hidden create draft | Charter N2: stacked dialogs from a stale row-click response. The stale-response guard (openRequest) covers only a second row click; no spec says what happens when another dialog opens in between. | frontend/src/BoardPage.tsx:141-147 (openRequest is not bumped when the create modal opens) and 182 (onNewBug); frontend/src/CreateBugModal.tsx:59-69 and EditBugModal.tsx:81-95 (both Escape handlers listen on window regardless of which dialog is on top) |
| 10 | confirmed | medium | exploratory | Board refreshes are not ordered: a slow refresh from before a delete lands afterwards and brings the deleted bug back | Charter N3: out-of-order responses on the list refresh. Spec 12 says the deleted bug disappears from the board; the stale-response guard added for row clicks was not applied to fetchBugs. | frontend/src/BoardPage.tsx:124-135 (fetchBugs sets whatever response arrives last) |
| 11 | confirmed | medium | exploratory | Anyone can lock any username for 15 minutes with 20 requests in 60ms; case and space variants count against the same account, although login itself is case-sensitive | Charter N4: rate-limit effects on a real user, and a third party locking someone out. The code comment says the limit is 'generous enough that no real user hits it'; it doesn't consider someone else hitting it for them. | backend/src/index.ts:85-91 (key = username.trim().toLowerCase(); lockout checked before the password); backend/src/authService.ts:32 (exact, case-sensitive username match); frontend/src/LoginPage.tsx:97-108 (no autocapitalize/autocorrect/spellcheck off) |
| 12 | confirmed | medium | functional | Escape does not close the create or edit modal when focus is on the Severity or State dropdown | specs/features/06-create-bug.md Scenario: User can close the create-bug modal with the Escape key; specs/features/09-edit-bug.md Scenario: User can close the edit-bug modal with the Escape key | frontend/src/CreateBugModal.tsx:63; frontend/src/EditBugModal.tsx:85; tests/accessibility/accessibility.spec.ts:62 |
| 13 | confirmed | medium | security | Logout is client-only: nothing is invalidated server-side and the stored value replays | 05-logout.md 'close my session and prevent other users from using my credentials'; ASVS 3.3.1 | frontend/src/auth.tsx:68-71 |
| 14 | confirmed | low | a11y | Edit modal gives no error for a blank field; Save just becomes disabled | WCAG 1.3.1 Info and Relationships; 3.3.1 Error Identification | frontend/src/EditBugModal.tsx:129,258-331 |
| 15 | confirmed | low | a11y | A failed Create or Edit save drops focus to <body> | WCAG 2.4.3 Focus Order | frontend/src/CreateBugModal.tsx:174,187,208,224,247; frontend/src/EditBugModal.tsx:265-361 |
| 16 | confirmed | low | a11y | Status region skips a repeated message and briefly announces a stale count | WCAG 4.1.3 Status Messages | frontend/src/BoardPage.tsx:160-170,365-377 |
| 17 | confirmed | low | contract | Bare /api still returns Express's HTML 404 (unknown /api/* paths and wrong methods are fixed) | Contract break: api-conventions.md reserves /api for the API; responses under it should be JSON. | backend/src/index.ts:261 (app.all("/api/*") does not match "/api" itself) |
| 18 | confirmed | low | contract | bugs.spec.ts pins blank and missing state as `invalid_state`, fixing the inconsistent error vocabulary as correct | Contract break (vocabulary): every other field reports missing/blank as blank_<field>. | tests/api/bugs.spec.ts:97-106; backend/src/bugService.ts:129-130 |
| 19 | confirmed | low | contract | The contract differs between the Vite proxy and the backend for OPTIONS and path case | Contract break: the same request should get the same status and shape on http://localhost:5173/api and on :3002. | frontend/vite.config.ts:5-13 (Vite's own CORS middleware answers OPTIONS before the proxy); backend/src/index.ts:249-259 |
| 20 | confirmed | low | contract | `invalid_severity` and `invalid_state` mean two different things: a wrong type and a wrong value | Contract break (vocabulary): one error code should have one meaning. The type check uses invalid_<field> for every field, which collides with the existing value codes for severity and state. | backend/src/index.ts:41-47 (readText), :186-196, :231-233 |
| 21 | confirmed | low | contract | Media-type and JSON checks run before routing, so a wrong method or unknown path can get 415 or 400 instead of 405 or 404 | Contract break (minor): the new 405/404 answers depend on the body. The method and path are wrong whatever the body is. | backend/src/index.ts:22-31 (global 415 middleware and express.json() ahead of every route) |
| 22 | confirmed | low | contract | One-line and blank title rules miss Unicode line separators and other invisible characters | Business rule: 06-create-bug.md says the title is a one-line summary and every field is required; the diff claims line breaks become a space and zero-width-only values are blank. | backend/src/bugService.ts:52 (INVISIBLE), :59-61 (oneLine) |
| 23 | confirmed | low | data | No field length limits: a 90,000-character title is accepted and stored | 06-create-bug: title is a concise one-line summary. | backend/src/bugService.ts:65-78, frontend/src/CreateBugModal.tsx:162-225 |
| 24 | confirmed | low | data | Other invisible-only values (LRM/RLM, soft hyphen, Hangul fillers, braille blank, bidi controls) still pass the blank check | 06-create-bug: each field is required and cannot be left blank. | backend/src/bugService.ts:52, frontend/src/CreateBugModal.tsx:17 |
| 25 | confirmed | low | data | Edit modal enables Save for a zero-width-only field that the API then rejects | 09-edit-bug: the save button is disabled if any of the fields are changed to be blank. | frontend/src/EditBugModal.tsx:123-127, frontend/src/EditBugModal.tsx:133-135 |
| 26 | confirmed | low | exploratory | No title length limit: the API accepts a 20,000-char title, which renders as a 9,649px-tall row (the overflow part is fixed) | Charter C7: long titles in the table layout. | frontend/src/BoardPage.tsx:292 (title <td> has no wrapping rule); backend/src/bugService.ts:61 (no max length) |
| 27 | confirmed | low | exploratory | No bug URL, and browser Back with a modal open leaves the board and silently discards the draft | Charter C5: deep links and Back/Forward through modals. Vision lists a 'Bug view' but it has no route. | frontend/src/App.tsx:22-34 (only /, /login, /board; modal and search state not in the URL); frontend/src/LoginPage.tsx:35 (ignores location.state.from) |
| 28 | confirmed | low | exploratory | Failed row opens and 'That bug no longer exists.' are only announced to screen readers; sighted users see nothing happen (load failures are fixed) | Charter N7: backend error on read paths. Spec 07 defines the empty-board message for an empty list; a failed load is not specified. | frontend/src/BoardPage.tsx:148-155 (setLastAction feeds only the sr-only live region at 229-231) |
| 29 | confirmed | low | exploratory | Logging out in one tab silently throws away an unsaved draft in another tab, and a save already in flight there still completes with no feedback | Charter N5: two tabs and a user switch. The new cross-tab logout follows spec 05 but says nothing about work open in the other tab. | frontend/src/auth.tsx:53-55 (the storage listener clears the user at once; ProtectedRoute unmounts the board with its modals) |
| 30 | confirmed | low | exploratory | Holding Enter on New Bug opens the form already showing 'Title is required. Description is required.' | Charter N6: keyboard-only flows, with Enter held (key repeat). Spec 06 expects validation messages after the user submits, not on open. | frontend/src/TitleBar.tsx:77-83 and frontend/src/CreateBugModal.tsx:57,160 (focus moves into the title input on open, so repeated Enter keydowns submit the empty form) |
| 31 | confirmed | low | exploratory | Bug titles can no longer be selected or copied with the mouse: dragging across a title selects nothing and opens the bug | Charter N7: clicking the row padding versus the title button. Copying a bug title (into chat, a commit message or a search) is an everyday use no spec mentions. | frontend/src/BoardPage.tsx:340-349 (the title is a <button>, which Chromium makes unselectable; the row onClick at 326 also fires after a drag) |
| 32 | confirmed | low | functional | Edit modal enables Save when a field holds only a zero-width space; the server then rejects it | specs/features/09-edit-bug.md Scenario: Save button is disabled when any required field is blank | frontend/src/EditBugModal.tsx:123-127 |
| 33 | confirmed | low | functional | Search regression: removing punctuation means "log in" no longer finds "log-in" and "save load" no longer finds "save/load" | specs/features/11-search-board.md Design: normalize punctuation on both sides of the match; Scenario: Typing in the search field filters bugs by title | frontend/src/BoardPage.tsx:44-45 |
| 34 | confirmed | low | security | Failed-login map grows without bound and stores each distinct username (up to ~100 KB) in memory | Bounded resource use; OWASP API4 (unrestricted resource consumption) | backend/src/index.ts:52,100-103 |
| 35 | potential | medium | security | Backend accepts any Host header, so a DNS-rebinding page could drive the unauthenticated API | OWASP A05/A01; aggravates security-01 now that the port is loopback-only | backend/src/index.ts (no Host check) |
| 36 | potential | low | contract | Whitespace-only password is treated as a real password (401) rather than blank (400 blank_password) | Business rule, open decision: 03-login.md requires a blank-password error and specifies trimming only for the username. | backend/src/authService.ts:19-29 |
| 37 | potential | low | data | Two UI tests still create without registering a title, and expectTitle matches only the exact stored title | tests/fixtures/bug-api.ts:3: every bug tests create is deleted afterwards. | tests/create-bug/create-bug.spec.ts:104-122, tests/create-bug/create-bug-plan.spec.ts:106-116, tests/fixtures/bug-api.ts:94-98 |
| 38 | gap | medium | a11y | Specs contain no accessibility requirement | specs/design/theme.md 'Other UI/UX' (accessibility placeholder); WCAG 2.2 AA used as authority | specs/design/theme.md:20 |
| 39 | gap | medium | security | Specs contain no security requirements (API authentication, session, password storage, brute-force) | Missing requirement: specs/features/02,03,05 describe only UI-level login/logout | specs/features/02-user-accounts.md, 03-login.md, 05-logout.md |
| 40 | gap | low | a11y | Accessibility suite has weak guards and leaves the new focus handling unguarded | Run rules: weak assertions in the suite are findings; WCAG 2.4.3, 4.1.2, 1.4.3/1.4.11 coverage | tests/accessibility/accessibility.spec.ts:33,41,62,72 |
| 41 | gap | low | contract | API tests now exist, but there is still no written API contract | Every endpoint's statuses and body shapes should be documented; api-conventions.md states only the /api prefix. | specs/engineering/api-conventions.md |
| 42 | gap | low | contract | tests/api still leaves claimed fixes unguarded, including PUT /api/bugs/<id>abc, stored-row responses and one-line titles | Every fixed break should have a test so a regression is noticed. | tests/api/id-parsing.spec.ts; tests/api/error-bodies.spec.ts; tests/api/bugs.spec.ts |
| 43 | gap | low | data | Persistence across a backend restart not demonstrated | tech-stack: single SQLite file at backend/data/buggyboard.db; 13-bug-status: state is stored in the database. | backend/src/db.ts:14-15 |
| 44 | gap | low | exploratory | Owner is free text: non-existent users and case variants ('Buggy' vs 'buggy') are stored as different owners | Charter C6. Spec 06 defines owner as 'the name of the user who owns the bug' but doesn't say whether it must be a real user or how case is handled. | backend/src/bugService.ts:62 (owner only trimmed) |
| 45 | gap | low | exploratory | Search does not fold accents: 'unicode' does not find 'Ünïcödé' | Charter N6: many long titles with sort and search. Spec 11 requires case-insensitive, whitespace- and punctuation-normalised matching but says nothing about diacritics. | frontend/src/BoardPage.tsx:42-46 (normalizeForSearch has no NFD/diacritic strip) |
| 46 | gap | low | functional | Empty-board and all-open-board scenarios cannot be run against the shared database | specs/features/07-bug-board.md Scenario: Board page shows an empty table when there are no bugs; specs/features/13-bug-status.md Scenario: No bugs matched message when selected state has no bugs | tests/bug-board/bug-board.spec.ts; tests/bug-status/bug-status.spec.ts:113 |
| 47 | gap | low | functional | Spec behaviours with no guard in tests/: sort kept across a state switch and after clearing search, and query-side punctuation ("log-in" matching "Login fails") | specs/features/13-bug-status.md design (sorting and search apply within the selected state); specs/features/11-search-board.md (normalisation on both sides; sorting preserved) | tests/bug-status, tests/search |
| 48 | hardening | low | contract | No length limit on title or description: a 10,000-character title is accepted with 201 | Business rule (not specified): 06-create-bug.md sets no maximum; the only limit is body-parser's 100 KB (now a JSON 413). | backend/src/bugService.ts:65-78 |
| 49 | hardening | low | contract | 429 too_many_attempts carries no Retry-After header | Contract (RFC 6585 section 4): a 429 MAY say how long to wait. Clients, including the login page, can only say 'try again later'. | backend/src/index.ts:88-91 |
| 50 | hardening | low | data | Concurrent edits: last write wins with silent lost update | 09-edit-bug Out of Scope: conflict detection (last write wins). | backend/src/bugService.ts:132-136 |
| 51 | hardening | low | security | No per-field length limit: a 90 KB title is stored and rendered | ASVS 5.1.4; bounded resource use | backend/src/bugService.ts:66-78 |
| 52 | hardening | low | security | Committed quality reports publish the local home path, OS username and full server stack traces | OWASP A05 / ASVS 7.4.1 intent; data in a place it should not be | origin/e2e-suite-and-quality-run commits a7fa601, ffb95fd |
| 53 | hardening | low | security | users.json stores passwords in plaintext and login compares them with !== | ASVS 2.4.1 (L2); OWASP A02/A07 | users.json, backend/src/authService.ts:33 |
| 54 | hardening | low | security | Login limiter is per-username and per-process only: unlimited password spraying, state lost on every restart | ASVS 2.2.1 (anti-automation), OWASP A07 | backend/src/index.ts:49-52 |
| 55 | fixed | high | a11y | Search input has role="search", so it is exposed as a landmark, not a textbox | WCAG 4.1.2 Name, Role, Value; 1.3.1 Info and Relationships | frontend/src/TitleBar.tsx:48 |
| 56 | fixed | high | a11y | Bug table rows have role="button", destroying row semantics | WCAG 1.3.1 Info and Relationships; 4.1.2 Name, Role, Value | frontend/src/BoardPage.tsx:263-273 |
| 57 | fixed | high | a11y | Open/Closed toggle selected state is conveyed only visually | WCAG 4.1.2 Name, Role, Value; 1.4.1 Use of Color | frontend/src/BoardPage.tsx:163-184 |
| 58 | fixed | high | functional | Search for "login" does not match "Issue with log-in": punctuation becomes a space instead of being removed | specs/features/11-search-board.md Scenario: Search matching is case insensitive and normalizes whitespace and punctuation | frontend/src/BoardPage.tsx:44 |
| 59 | fixed | medium | a11y | Create and Edit modals do not trap focus; Tab walks into the page behind | WCAG 2.4.3 Focus Order; 2.1.2 (aria-modal="true" contract); theme.md modal consistency | frontend/src/CreateBugModal.tsx:106-111; frontend/src/EditBugModal.tsx:207-212 |
| 60 | fixed | medium | a11y | Focus is dropped to <body> after closing a modal, saving, deleting, or clearing search | WCAG 2.4.3 Focus Order | frontend/src/BoardPage.tsx:296-309; frontend/src/TitleBar.tsx:55-59 |
| 61 | fixed | medium | a11y | Delete confirmation dialog does not receive focus; focus stays behind it in the Edit dialog | WCAG 2.4.3 Focus Order; 4.1.2 (two simultaneous aria-modal dialogs) | frontend/src/EditBugModal.tsx:358-364 |
| 62 | fixed | medium | a11y | Login 'Log in' subtitle in #b8ae76 on white is 2.25:1 | WCAG 1.4.3 Contrast (Minimum) | frontend/src/LoginPage.tsx:71 |
| 63 | fixed | medium | a11y | Search placeholder text is 2.41:1 | WCAG 1.4.3 Contrast (Minimum) | frontend/src/TitleBar.tsx:53 |
| 64 | fixed | medium | a11y | Board header does not reflow at 320 CSS px (400% zoom); Logout is off-screen | WCAG 1.4.10 Reflow | frontend/src/TitleBar.tsx:28,43,45 |
| 65 | fixed | medium | a11y | No status live region: search results, filter, save and delete are not announced | WCAG 4.1.3 Status Messages; 4.1.2 | frontend/src/BoardPage.tsx:243-259; frontend/src/BoardPage.tsx:148-186 |
| 66 | fixed | medium | a11y | Open/Closed selected state disappears in forced-colors (Windows High Contrast) mode | WCAG 1.4.11 Non-text Contrast; 1.4.1 Use of Color | frontend/src/BoardPage.tsx:163-184 |
| 67 | fixed | medium | a11y | Escape meant for a native <select> popup closes the whole Create/Edit modal and discards input | WCAG 2.1.1 Keyboard; 3.3.4 Error Prevention (data loss) | frontend/src/CreateBugModal.tsx:44-54; frontend/src/EditBugModal.tsx:73-86 |
| 68 | fixed | medium | contract | POST /api/login returns 500 HTML with a stack trace when username is a number, array or object | Contract break: a client input error must produce a 4xx JSON {error,message} body. | backend/src/index.ts:41-47, :78-83 |
| 69 | fixed | medium | contract | Every body-parser failure returns Express's HTML error page with a stack trace | Contract break: every /api error response is JSON {error,message}. | backend/src/index.ts:268-283 |
| 70 | fixed | medium | contract | Bug id parsing accepts trailing garbage: /api/bugs/<id>abc, <id>.5, <id>e5 and %20<id> act on the real bug, including PUT and DELETE | Contract break: 400 invalid_id for any id that is not a positive whole number. | backend/src/index.ts:33-39 |
| 71 | fixed | medium | data | Edit modal silently strips newlines from a stored title; any title edit persists the joined text | 06-create-bug: title is a one-line summary; 09-edit-bug: save persists only the user's modifications. | backend/src/bugService.ts:59-61, backend/src/bugService.ts:68 |
| 72 | fixed | medium | data | Path ids with trailing junk (Nabc, N.5, Ne5) resolve to bug N on GET, PUT and DELETE | 06-create-bug: ID is a unique integer identifier. | backend/src/index.ts:34-40 |
| 73 | fixed | medium | data | Suite leaves a prefix-less U+200B bug in the shared DB on every api run; cleanup refuses to delete it | tests/fixtures/bug-api.ts: every bug tests create is deleted afterwards. | tests/data/round-trip.spec.ts:84-88, tests/fixtures/bug-api.ts:94-103 |
| 74 | fixed | medium | exploratory | After another session deletes a bug, the board keeps the dead row: Save/Delete show 'Bug not found.' and clicking the row does nothing | Charter C1: delete in one session while the bug is open in another. Spec 12 covers only the deleting user's board. | frontend/src/EditBugModal.tsx:176,210 (404 path keeps the modal open, no refetch); frontend/src/BoardPage.tsx:118-127 (handleRowClick ignores !res.ok) |
| 75 | fixed | medium | exploratory | Logging out or switching user in one tab doesn't reach other tabs: they keep creating bugs, and default the owner to the old user | Charter C3: two tabs, one session. Spec 05 says that after logout 'the user is ... no longer authenticated', but multi-tab behaviour isn't specified. | frontend/src/auth.tsx:46-55 (user read from localStorage once on mount, no 'storage' event listener) |
| 76 | fixed | medium | exploratory | Clicking two rows on a slow network opens the second bug, then silently swaps the modal to the first and discards what the user typed | Charter N1/N2: out-of-order responses. No spec says what happens when row opens overlap. | frontend/src/BoardPage.tsx:114-124 (handleRowClick sets whichever GET response arrives last; no loading state) |
| 77 | fixed | medium | functional | No feature in specs/features/ has automated product coverage in tests/ | specs/engineering/test-automation-patterns.md; all Scenarios in specs/features/01-13 | tests/ |
| 78 | fixed | medium | functional | Shipped BoardPage 'Logout' and 'New Bug' locators are not exact, so any bug whose title contains those words breaks 20 tests | specs/engineering/test-automation-patterns.md (independent tests); run rule: other agents change data concurrently | tests/pages/board-page.ts:49-50 |
| 79 | fixed | medium | security | Diff adds a plaintext password (matt / <redacted>) to tracked users.json | OWASP A02/A07, ASVS 2.4.1 | users.json |
| 80 | fixed | medium | security | No rate limiting or lockout on POST /api/login | OWASP A07, ASVS 2.2.1 | backend/src/index.ts:49-103 |
| 81 | fixed | medium | security | Non-string login fields and malformed or oversized bodies return HTML stack traces with absolute paths | OWASP A05, ASVS 7.4.1; ASVS 5.1.3 | backend/src/index.ts:41-47, 265-283 |
| 82 | fixed | medium | security | Backend listens on all interfaces (*:3002) while the UI binds to loopback only | OWASP A05 | backend/src/index.ts:9,285 |
| 83 | fixed | low | a11y | Clear-search button is 22x36 px, next to the input | WCAG 2.5.8 Target Size (Minimum) | frontend/src/TitleBar.tsx:59 |
| 84 | fixed | low | a11y | Submitting login drops focus to <body> because the fields are disabled while loading | WCAG 2.4.3 Focus Order | frontend/src/LoginPage.tsx:89,107,119 |
| 85 | fixed | low | a11y | Page title is 'BuggyBoard' on every route | WCAG 2.4.2 Page Titled | frontend/index.html:7 |
| 86 | fixed | low | a11y | Login page has no main landmark and 'Log in' is a paragraph, not a heading | WCAG 1.3.1 Info and Relationships (best practice) | frontend/src/LoginPage.tsx:58-71 |
| 87 | fixed | low | a11y | 'BuggyBoard' heading collapses to 0 px at 640 CSS px (200% zoom) | WCAG 1.4.4 Resize Text | frontend/src/TitleBar.tsx:28-45 |
| 88 | fixed | low | a11y | Route changes (login -> board, logout -> login) are silent and leave focus on <body> | WCAG 2.4.3 Focus Order; 4.1.3 (best practice for SPAs) | frontend/src/App.tsx; frontend/src/LoginPage.tsx |
| 89 | fixed | low | a11y | Firefox: table scroll container is an unnamed Tab stop | WCAG 4.1.2 Name, Role, Value; 2.4.3 | frontend/src/BoardPage.tsx:188 |
| 90 | fixed | low | contract | Invalid severity reports error code `blank_severity`; wrong-type fields report `blank_*` | Contract break: a client must be able to tell 'critical' from ''. | backend/src/bugService.ts:72-74; backend/src/index.ts:186-188, :231-233 |
| 91 | fixed | low | contract | A JSON body sent without Content-Type: application/json is silently read as empty and reported as blank fields | Contract break (minor): a body the server will not parse should be 415. | backend/src/index.ts:22-29 |
| 92 | fixed | low | data | Create/update responses echo the input instead of the stored row; lone surrogates read back as U+FFFD | A bug reads back exactly as written; the 201/200 body reflects what was persisted. | backend/src/bugService.ts:97, backend/src/bugService.ts:136 |
| 93 | fixed | low | data | Invisible-only values (U+200B, U+2060) pass the required-field check for every field | 06-create-bug: each field is required and cannot be left blank. | backend/src/bugService.ts:52-56 |
| 94 | fixed | low | data | After a 404 on save (bug deleted elsewhere) the board keeps listing the deleted row | Board reflects stored data; 09-edit-bug save/cancel semantics. | frontend/src/EditBugModal.tsx:167, frontend/src/EditBugModal.tsx:201, frontend/src/BoardPage.tsx:378 |
| 95 | fixed | low | exploratory | Oversized or malformed body gets an HTML error page from the API; the modal shows only a generic 'Failed to save bug.' | Charter C8: the backend rejects a request while a modal is open. No field length limits are specified. | backend/src/index.ts:10 (express.json() default 100kb limit, no JSON error handler); frontend/src/CreateBugModal.tsx and EditBugModal.tsx (no maxLength) |
| 96 | fixed | low | exploratory | Create submit handler has no in-flight guard; two submits in one task create duplicate bugs | Charter C4: rapid double-click on Save, or Enter held down. | frontend/src/CreateBugModal.tsx:56 (handleSubmit doesn't check `loading`; only the button's disabled attribute protects it) |
| 97 | fixed | low | exploratory | Reopening the create modal paints the previous draft and errors for one frame; keys typed in that frame are appended to the old draft (lead's P-1) | Charter N5 (rapid open/close). Lead's planning finding P-1 (specs/testing/create-bug-test-plan.md 1.5). This is the same root cause as functional-04, which is filed as hardening. | frontend/src/CreateBugModal.tsx:32-42 (state reset in useEffect; the component stays mounted and returns null when closed, so the old state survives until the effect runs) |
| 98 | fixed | low | functional | Create-bug modal first renders the previous draft (and a blank Owner), then resets after paint, so early input is overwritten | specs/features/06-create-bug.md Scenario: Create-bug modal defaults owner to the current user; specs/testing/create-bug-test-plan.md 1.5 | frontend/src/CreateBugModal.tsx:42 |
| 99 | fixed | low | functional | Two shipped tests assert less than their titles or scenarios claim | specs/features/02-user-accounts.md; specs/features/12-delete-bug.md Scenario: Canceling the confirmation modal leaves the bug intact | tests/user-accounts/users-file.spec.ts:19; tests/delete-bug/delete-bug.spec.ts:51 |
| 100 | fixed | low | security | Missing security headers and X-Powered-By: Express on API responses | OWASP A05, ASVS 14.4, 14.3.3 | backend/src/index.ts:13-19 |
| 101 | fixed | low | security | Lax bug-id parsing: '1 OR 1=1', '1;DROP TABLE bugs', '1.9', '1e3' resolve to bug 1 | ASVS 5.1.3 | backend/src/index.ts:33-39 |

### Not tested

- **a11y** — axe-core: @axe-core/playwright is not installed, so it was not run; no packages added
- **a11y** — Real screen readers (VoiceOver, NVDA, JAWS): wording and timing of the status region (a11y-26), whether the h1 focus on load is announced, virtual-cursor containment given only aria-modal (no inert on the background), and whether role=alert errors are read
- **a11y** — WebKit/Safari: the suite skips it, and Tab skips buttons by default
- **a11y** — --project=firefox run of tests/accessibility: every test there skips non-Chromium, so it would prove nothing; the headless Firefox walk was used instead
- **a11y** — Real browser zoom and real Windows High Contrast: viewports and forcedColors were emulated
- **a11y** — Headed native <select> popups: Escape inside an open popup (a11y-19)
- **a11y** — Speech input and mobile screen-reader gestures
- **contract** — Baseline origin/main was not run. Pre-existing behaviour comes from last run's evidence (quality-reports/2026-09-22T222029Z) and git diff cce584c.
- **contract** — The 500 internal_error branch of the error handler: no external input reached it. It is covered by code reading only, and nothing in tests/api reaches it (contract-09).
- **contract** — Lockout as denial of service, and security properties of the rate limit: 20 bad passwords lock a real user out for 15 minutes even with the right password, because the check comes before the credential check (index.ts:88); the window runs from the first failure, not the last; the failedLogins map grows without bound with throwaway usernames. From code reading only (a real account was not locked to prove it), and it belongs to security. Passed on to the lead.
- **contract** — Note for the suite owner: login.spec.ts 'wrong password' and 'username in the wrong case' each add a failure to buggy's shared counter (the key is lower-cased). Repeated runs without a successful buggy login in between (e.g. --repeat-each 10) would lock buggy out for every agent. This run reset the counter with one successful login.
- **contract** — Authentication on bug routes: owned by security, guarded by test.fail in auth.spec.ts.
- **contract** — Frontend behaviour with the new statuses was checked by reading the code only: LoginPage, CreateBugModal and EditBugModal read `message` from any non-OK JSON body, send Content-Type: application/json on POST/PUT, and DELETE sends no body, so none of them can hit 415. The lead's full suite (504 passed, 0 failed) exercises the UI paths.
- **contract** — Concurrent writes, ETag/If-None-Match and the lone-surrogate replacement (B29) as a data-integrity question: left to data.
- **contract** — Backward compatibility: there is no versioned contract or consumer to compare against. The leading-zero id change (/api/bugs/01 200 -> 400) is the only change I found that alters a response that used to succeed.
- **contract** — No Playwright tests were written; the dispatch forbids changes under tests/. contract-09 lists the guards to add.
- **data** — Persistence across backend restart (restart forbidden; data-08)
- **data** — Schema migration safety and backup/restore (no mechanism by design)
- **data** — Editing a legacy multi-line title in the modal: no such rows exist and the DB is read-only to me, so it cannot be set up (the API now normalises every write)
- **data** — A second browser session as vanny for concurrency (parallel API clients were used)
- **data** — Display spoofing with bidi controls or look-alike padding: stored and rendered verbatim, which is an integrity pass; the spoofing question belongs to security
- **data** — Titles with invisible characters only (data-05/11 probes) could not carry the [data] prefix; each was deleted straight after its request and 0 remained
- **exploratory** — Real slow or flaky networks, other browsers (Firefox, WebKit), and real mobile or touch input. The mobile auto-capitalise path in exploratory-16 is inferred from the missing input attributes, not observed on a device.
- **exploratory** — A real lockout of buggy, vanny or matt (forbidden by the run rules). That the correct password is refused during a lock is shown with a blank password on a throwaway account plus the check order in index.ts, not with a real account.
- **exploratory** — Rapid close-and-reopen focus race: a scripted Escape-then-Enter with no human-scale gap sent the second Enter before the deferred focus return (setTimeout) put focus back on New Bug, so it opened nothing. A human gap is far longer than the timer, so this is not filed.
- **exploratory** — Screen readers and IME/composition input.
- **exploratory** — Hand-off to functional: in the edit modal, a title of only spaces leaves Save disabled with no message, while Create says 'Title is required.' A zero-width-only title in Edit enables Save and gets the server's 'Title is required.' Neither is filed here (N8).
- **exploratory** — Hand-off to a11y: the header now wraps at 375 and 320px with no horizontal scroll (Logout right edge at 240px), and the Tab trap held for 12 Tabs in an unchanged edit modal. This closes the previous run's reflow and Tab-escape hand-offs, but a11y owns the verdict.
- **exploratory** — Suite gap for the lead: tests/resilience covers Escape during a save but not the header Close button (exploratory-10), and nothing asserts a visible message after a failed row open (exploratory-12).
- **functional** — Firefox and WebKit: Chromium only, --workers=1
- **functional** — 01 favicon art style and the 08 'HIGH more prominent' visual judgement
- **functional** — 07 empty board and the exact 13-S7 precondition: shared DB (functional-03)
- **functional** — 06/09 blank-severity outline rows through the UI: the dropdown has no blank option (API 400 is guarded by tests/api)
- **functional** — Escape while a native select popup is actually open: headless Playwright cannot open the native popup, so whether the SELECT guard is needed for that case is not established
- **functional** — Search performance while typing
- **functional** — Board counts and totals: never asserted (shared DB)
- **functional** — Cross-tab logout, stale row-click responses, load-error state, 404-on-open refresh: guarded by tests/resilience and delete-bug-plan 3.1 (passing in the lead's run), not re-measured
- **functional** — Full shipped suite: the lead's; only the folders listed in commands were run
- **security** — TLS, HSTS, cookie flags and production headers: local dev server over plain HTTP, no cookies are issued, and the Vite dev document headers are not production headers
- **security** — Lockout of a real account and whether its correct password is refused while locked: not sent (would lock a shared account for 15 minutes); read from code (index.ts:88 before :93)
- **security** — Lockout expiry after 15 minutes and reset-on-success for a real account: not waited for / needs a real account; read from code
- **security** — Limiter reset on backend restart: not restarting the shared server; read from code
- **security** — End-to-end DNS rebinding and off-host reachability (localhost-only rule)
- **security** — Statistically meaningful timing oracle: plaintext !== compare, identical 401 bodies for unknown user and wrong password
- **security** — PR / remote state on GitHub: not queried; history assessed from local refs (origin/e2e-suite-and-quality-run == HEAD ffb95fd)
- **security** — Authorization / per-user ownership: deliberately unowned, no role model
- **security** — XSS in the delete confirmation with <script>/<svg> payloads: <img onerror> guarded by tests/security/security.spec.ts; frontend/src has no dangerouslySetInnerHTML or innerHTML
<!-- findings:end -->
