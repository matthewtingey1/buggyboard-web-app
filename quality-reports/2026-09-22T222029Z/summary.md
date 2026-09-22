# BuggyBoard quality run 2026-09-22T222029Z

## Verdict

**Not ready.** Confidence: medium-high. It rests on six reports (all delivered), a lead full-suite run of 422 tests (410 passed, 12 skipped by design, 0 failed, 0 unexpected passes, archived), and a regression suite that now guards the functional surface on three engines. Agent re-tests ran mostly in Chromium; a11y also covered Firefox.

The candidate changes no product code against `origin/main` (cce584c): only the backend port, plus tests and tooling. Every open defect therefore predates it. The verdict is about the product.

**Blocking** (all carried over from run 2026-09-22T205320Z, none fixed)
- security-01 (critical): every `/api/bugs` verb works anonymously. This run confirmed PUT too.
- security-02 (high): the session is a forgeable localStorage value.
- a11y-02, a11y-03, a11y-04 (high): wrong roles on search and rows; Open/Closed state is visual only.
- functional-01 (high): search punctuation (spec 11). This is still the only failing acceptance criterion.
- exploratory-01 (high reading): lost update on concurrent edit. See C1.

**Changed since the previous run**
- Fixed: security-04 (the personal credential is in no commit, including the pre-rebase history) and functional-02 (a product regression suite now exists).
- New: 22 findings. Most fall into three groups:
  - Timing (exploratory-10, 11, 12): late or failed responses act on the wrong modal or report "No bugs.".
  - Accessibility (a11y-17 raised to medium, a11y-18 to a11y-23).
  - The suite itself (below).
- The suite had four defects of its own. Agents found them, and I fixed them in `tests/` after the agents finished and re-ran the suite green with no residue:
  - data-09: a zero-width-title guard leaked rows that cleanup skipped. Six rows were deleted.
  - data-10: bugs created before `track()` could leak.
  - functional-05: the New Bug and Logout locators also matched bug rows, failing 20 tests whenever such a title existed.
  - functional-06: two tests asserted less than their titles claim.

**Gaps, which are not defects**
- No written API contract (contract-08, now low).
- No accessibility or security requirements (a11y-01, security-11).
- Behaviours nothing guards: contract-09 (unguarded contract breaks). functional-07 (test-plan gap rows) was fixed after the run; see LEAD-03.
- Not demonstrated: restart persistence (data-08); the empty and all-open board scenarios (functional-03).
- Never run: a real screen reader, axe, WebKit keyboard behaviour, real zoom or High Contrast.

**Guarded vs measured.** The functional surface is now guarded; each known defect is pinned by a `test.fail` test. Contrast, reflow, focus return, announcements and the timing findings were measured once in this run and nothing guards them.

### Reconciliation

78 merged findings: 16 are folded into survivors or lead records, which leaves 62, plus 3 lead records (LEAD-01 to LEAD-03) makes 65 in the report.

| Surviving | Folded in | Basis |
|---|---|---|
| contract-03 | data-02, security-09 | `parseInt` id parsing, now shown for GET, PUT and DELETE by all three agents. |
| contract-02 | contract-01, security-06, exploratory-04 | No JSON error middleware; HTML bodies with stack traces. Fix owner: contract. contract-05's fix also needs a service change (the service never returns BLANK_SEVERITY). |
| security-10 | data-04, exploratory-05, contract-12 | No field length limits. The limit value is a product decision. |
| data-06 | exploratory-02 | The stale row after a delete elsewhere. |
| functional-04 | exploratory-09 | One draw-then-reset cause (`CreateBugModal.tsx` resets in `useEffect` after paint). exploratory measured it: keys typed in the first frame merge into the old draft (5 of 5 runs). |
| LEAD-01 | functional-02 | No product coverage. Fixed. |
| LEAD-02 | data-09, data-10, functional-05, functional-06 | Suite defects found this run. Fixed in `tests/` after the run. |
| LEAD-03 | functional-07 | Test-plan gap rows were unguarded. Fixed after the run: every gap row is now a test generated with `/playwright-cli`, and the full suite re-ran at 497 tests (483 passed, 14 skipped, 0 failed). |

**C1, still one observation with two readings.** exploratory-01 and data-07 observe last-write-wins, and the re-tests added a PUT racing a DELETE, which did not resurrect the bug. The spec 09 owner decides.

**Related but not folded**
- exploratory-10 (Escape works during a save) and a11y-19 (Escape meant for a `<select>` closes the modal) share the window-level Escape handler but fail differently. Fix them together.
- contract-10 (a missing state reports `invalid_state`, unlike the `blank_<field>` of every other field) is a contract choice, not a test bug. It stays pinned until someone decides, and belongs with contract-08.

**Needs a decision: security-12.** The run-1 reports committed to public PR #1 include the home path, the macOS username and full stack traces. It's low severity, but it's personal and public. Redacting it before merge is the user's call.

**Hygiene.** No `[slug]` or `[e2e]` rows remain. Only the public buggy and vanny demo passwords appear in this run's evidence; the personal password appears nowhere. The lead's `full-suite.txt` was empty because the configured reporters printed nothing; it was reconstructed from the archived run, and `playwright.config.ts` now includes a `list` reporter.

## Merged report

<!-- findings:start -->
_Generated by `quality-summary.js 2026-09-22T222029Z` at 2026-09-22T22:36:08.075Z. Do not hand-edit._

### Agents that reported

| Agent | Verdict | Confidence | Findings | Scope |
|---|---|---|---|---|
| a11y | not-ready | medium | 23 | Re-test of all 17 findings from run 2026-09-22T205320Z (no frontend source changed vs cce584c), then new checks. Headless keyboard-only walk in Chromium AND Firefox: login (bad and good password), board tab order, New Bug trap (Tab and Shift+Tab), Escape and Close X, validation, select keyboard use, save, search and clear, open row with Enter and Space, edit and save, Delete -> confirm -> Escape -> confirm, Open/Closed toggle, sort header twice, logout. ariaSnapshot for every view in both engines, live-region inventory after each action, computed contrast (22 pairs), reflow at 320 and 640 CSS px, 1.4.12 text-spacing injection, forced-colors emulation, target sizes. Scoped run of tests/accessibility/accessibility.spec.ts (Chromium). Each walk created one [a11y] bug and deleted it by keyboard; none remain. |
| contract | ready-with-known-risk | high | 12 | Re-test of contract-01..08 from run 2026-09-22T205320Z, then the classes nothing in tests/api guards: PUT with malformed ids, unsupported methods (PATCH, PUT/DELETE on collection, GET login, DELETE health), HEAD and OPTIONS/CORS preflight on proxy (:5173) and direct (:3002), content types (none, text/plain, vnd.api+json, form, multipart, charset=latin1, Content-Encoding gzip/br), non-object JSON bodies, 200 KB bodies and long fields, routing edges (trailing slash, upper-case path, extra segment, zero/huge id), response headers. 65 probe rows plus header captures; scoped run of tests/api (53 tests) and a review of what those tests assert. |
| data | ready-with-known-risk | high | 10 | Re-test of data-01..08 from run 2026-09-22T205320Z. New input classes not guarded by tests/data/round-trip.spec.ts, for title/owner/description on create AND update, compared across POST/PUT response, GET :id, GET list and a read-only SQLite connection: NUL, NBSP (padding and inner), leading BOM, U+3000 padding, bidi override U+202E, bidi isolates U+2067/2069, U+2028, CR-only, C0 controls BEL/ESC, NFD vs NFC, lone high/low surrogates, astral + ZWJ, U+200B/U+2060-only. UI path (headless chromium): multi-line title edit (data-01), NBSP/bidi/NUL/lone-surrogate create -> DB -> board -> edit modal, stale edit after delete (data-06), Open->Closed lifecycle via filter. Concurrency: 20 rounds of parallel full-row PUTs, stale overwrite, PUT/DELETE race, PUT and DELETE after delete. Suite hygiene: residue in the shared DB after the lead's and my runs, and whether the bugApi fixture cleans up on assertion failure, timeout, and create-before-track. |
| exploratory | ready-with-known-risk | medium | 13 | Re-test of exploratory-01..08 and the lead's P-1, then 8 new time-boxed charters run headless in Chromium against the live app (UI :5173, API via proxy): N1 slow responses during save/delete with Escape, N2 out-of-order row-open responses, N3 keyboard-only create/edit/delete end to end, N4 viewports 1280/768/375/320, N5 rapid open/close of both modals and held Enter on Delete, N6 200 long-title bugs with search and sort together, N7 API failure on read paths, N8 Back and reload during a pending save. Slow networks were simulated with page.route delays. Every record carried the [exploratory] prefix and all were deleted afterwards (0 remain). |
| functional | ready-with-known-risk | high | 7 | Every Scenario / Scenario Outline in specs/features/01-13 on the working tree (baseline origin/main cce584c), headless Chromium, 1 worker, http://localhost:5173. Re-ran the previous run's 86 atomic functional tests (copied to evidence/functional/prev; two harness-only fixes: users.json path depth and reading the matt password from users.json at runtime). Added 26 scratch tests in evidence/functional/gaps for the specs/testing/*.md '❌ gap' rows and for spec clauses the shipped suite misses. Spot-checked the assertions in tests/login, logout, title-bar, create-bug, bug-board, board-severity, edit-bug, sort, search, delete-bug, bug-status, favicon, user-accounts, and ran tests/title-bar, tests/login/session.spec.ts, tests/logout and tests/create-bug against a bug whose title contains 'New Bug Logout'. |
| security | not-ready | high | 13 | Re-test of all 11 run-1 findings; anonymous PUT and lax-id PUT/DELETE on own [security] bugs; logout replay in headless Chromium; login brute force (30 attempts), error disclosure, message oracle; <script>, <svg onload> and SQL metacharacters in title, owner and description on board and edit modal; CORS foreign-origin preflight and text/plain POST; response headers; 90 KB/150 KB/1.1 MB bodies; bind addresses; npm audit (prod and full). Diff slice: committed users.json, branch history incl. pre-rebase and force-pushed commits, committed tests/, quality-reports/, quality-report/, trace.zip contents, playwright.config.ts, archive-reporter, quality:* scripts. Existing guards run scoped: tests/security/security.spec.ts, tests/api/auth.spec.ts. |

### Findings

| # | Status | Severity | Agent | Finding | Requirement | Location |
|---|---|---|---|---|---|---|
| 1 | confirmed | critical | security | Every /api/bugs verb works with no session: anonymous read, create, edit and delete | 03-login.md 'Only users listed in users.json are valid login credentials'; 05-logout.md 'prevent other users from using my credentials'; OWASP A01/A07, ASVS 4.1.1 (access control enforced server-side) | backend/src/index.ts:75-182 |
| 2 | confirmed | high | a11y | Search input has role="search", so it is exposed as a landmark, not a textbox | WCAG 4.1.2 Name, Role, Value; 1.3.1 Info and Relationships | frontend/src/TitleBar.tsx:48 |
| 3 | confirmed | high | a11y | Bug table rows have role="button", destroying row semantics | WCAG 1.3.1 Info and Relationships; 4.1.2 Name, Role, Value | frontend/src/BoardPage.tsx:263-273 |
| 4 | confirmed | high | a11y | Open/Closed toggle selected state is conveyed only visually | WCAG 4.1.2 Name, Role, Value; 1.4.1 Use of Color | frontend/src/BoardPage.tsx:163-184 |
| 5 | confirmed | high | exploratory | Concurrent edits silently overwrite: saving a stale edit modal reverts another user's change (lost update) | Charter C2: two users editing one bug. Vision: every user has full access to all bugs, so concurrent edits are expected, yet no spec says what happens when they collide. | frontend/src/EditBugModal.tsx:160 (PUT sends the whole record); backend/src/bugService.ts:120 (unconditional UPDATE) |
| 6 | confirmed | high | functional | Search for "login" does not match "Issue with log-in": punctuation becomes a space instead of being removed | specs/features/11-search-board.md Scenario: Search matching is case insensitive and normalizes whitespace and punctuation ("login" must match "Login fails" and "Issue with log-in") | frontend/src/BoardPage.tsx:44 |
| 7 | confirmed | high | security | Session is a client-side localStorage flag; any string, including a non-existent user, opens the board | 03-login.md 'Only users listed in users.json are valid login credentials'; ASVS 3.1/3.2 (server-generated session tokens) | frontend/src/auth.tsx:25-43, frontend/src/ProtectedRoute.tsx:13-17 |
| 8 | confirmed | medium | a11y | Create and Edit modals do not trap focus; Tab walks into the page behind | WCAG 2.4.3 Focus Order; 2.1.2 (aria-modal="true" contract); theme.md modal consistency | frontend/src/CreateBugModal.tsx:106-111; frontend/src/EditBugModal.tsx:207-212 |
| 9 | confirmed | medium | a11y | Focus is dropped to <body> after closing a modal, saving, deleting, or clearing search | WCAG 2.4.3 Focus Order | frontend/src/BoardPage.tsx:296-309; frontend/src/TitleBar.tsx:55-59 |
| 10 | confirmed | medium | a11y | Delete confirmation dialog does not receive focus; focus stays behind it in the Edit dialog | WCAG 2.4.3 Focus Order; 4.1.2 (two simultaneous aria-modal dialogs) | frontend/src/EditBugModal.tsx:358-364 |
| 11 | confirmed | medium | a11y | Severity badge text fails 4.5:1 on its own tint (HIGH 3.77, MID 2.93, LOW 4.32) | WCAG 1.4.3 Contrast (Minimum); spec 08 colours | frontend/src/index.css:8-10,22-33 |
| 12 | confirmed | medium | a11y | Login 'Log in' subtitle in #b8ae76 on white is 2.25:1 | WCAG 1.4.3 Contrast (Minimum) | frontend/src/LoginPage.tsx:71 |
| 13 | confirmed | medium | a11y | Search placeholder text is 2.41:1 | WCAG 1.4.3 Contrast (Minimum) | frontend/src/TitleBar.tsx:53 |
| 14 | confirmed | medium | a11y | Focus ring, input borders and selected toggle fail 3:1 non-text contrast | WCAG 1.4.11 Non-text Contrast (2.4.7 relies on it) | frontend/src/*.tsx focus:ring-primary classes; input border-stone-300; BoardPage.tsx:168 |
| 15 | confirmed | medium | a11y | Board header does not reflow at 320 CSS px (400% zoom); Logout is off-screen | WCAG 1.4.10 Reflow | frontend/src/TitleBar.tsx:28,43,45 |
| 16 | confirmed | medium | a11y | No status live region: search results, filter, save and delete are not announced | WCAG 4.1.3 Status Messages; 4.1.2 | frontend/src/BoardPage.tsx:243-259; frontend/src/BoardPage.tsx:148-186 |
| 17 | confirmed | medium | a11y | Open/Closed selected state disappears in forced-colors (Windows High Contrast) mode | WCAG 1.4.11 Non-text Contrast; 1.4.1 Use of Color | frontend/src/BoardPage.tsx:163-184 |
| 18 | confirmed | medium | contract | POST /api/login returns 500 HTML with a stack trace when username is a number, array or object | Contract break: a client input error must produce a 4xx JSON {error,message} body like every other login failure; the bug routes already coerce non-strings. | backend/src/index.ts:38-39; backend/src/authService.ts:19 |
| 19 | confirmed | medium | contract | Every body-parser failure (malformed JSON, non-object JSON, 413 too large, 415 charset/encoding, bad gzip) returns Express's HTML error page with a stack trace | Contract break: every /api error response is JSON {error,message}; express.json() errors bypass that shape. | backend/src/index.ts:11 (express.json(), no error middleware before app.listen at :184) |
| 20 | confirmed | medium | contract | Bug id parsing accepts trailing garbage: /api/bugs/<id>abc, <id>.5, <id>e5 and %20<id> act on the real bug, including PUT and DELETE | Contract break: the route documents 400 invalid_id for a non-numeric id; parseInt accepts a numeric prefix. Negative, zero and hex ids return 404 not_found instead of 400. | backend/src/index.ts:81, :95, :140 |
| 21 | confirmed | medium | data | Edit modal silently strips newlines from a stored title; any title edit persists the joined text | 09-edit-bug: modal shows the bug's title; save persists only the user's modifications. 06-create-bug: title is a one-line summary (not enforced server-side). | backend/src/bugService.ts:60, backend/src/bugService.ts:107, frontend/src/EditBugModal.tsx:249 |
| 22 | confirmed | medium | data | Path ids with trailing junk (Nabc, N.5, Ne5) resolve to bug N on GET, PUT and DELETE | 06-create-bug: ID is a unique integer identifier; index.ts intends to reject non-numeric ids with 400 invalid_id. | backend/src/index.ts:81, backend/src/index.ts:95, backend/src/index.ts:140 |
| 23 | confirmed | medium | data | Suite leaves a prefix-less U+200B bug in the shared DB on every api run; cleanup refuses to delete it | Run rules: every record a test creates carries its prefix and is deleted afterwards (tests/fixtures/bug-api.ts:5 comment; REPORT-CONTRACT 'delete only your own'). | tests/data/round-trip.spec.ts:80-81, tests/fixtures/bug-api.ts:96-99 |
| 24 | confirmed | medium | exploratory | After another session deletes a bug, the board keeps the dead row: Save/Delete show 'Bug not found.' and clicking the row does nothing | Charter C1: delete in one session while the bug is open in another. Spec 12 covers only the deleting user's board. | frontend/src/EditBugModal.tsx:176,210 (404 path keeps the modal open, no refetch); frontend/src/BoardPage.tsx:118-127 (handleRowClick ignores !res.ok) |
| 25 | confirmed | medium | exploratory | Logging out or switching user in one tab doesn't reach other tabs: they keep creating bugs, and default the owner to the old user | Charter C3: two tabs, one session. Spec 05 says that after logout 'the user is ... no longer authenticated', but multi-tab behaviour isn't specified. | frontend/src/auth.tsx:46-55 (user read from localStorage once on mount, no 'storage' event listener) |
| 26 | confirmed | medium | exploratory | Escape ignores the Saving/Deleting lock: a late save response closes the next draft, and a failed save after Escape is silent | Charter N1: slow network during save and delete. Specs 06 and 09 say Escape has the same effect as Cancel. Cancel is disabled while saving, but Escape is not (hand-off to functional for that clause). What a late response does to a newer modal is not specified anywhere. | frontend/src/CreateBugModal.tsx:44-54 (Escape handler has no loading check) and 85-93 (the late response calls onClose/setValidationErrors on whatever draft is now open); frontend/src/EditBugModal.tsx:73-87 and 154-160; frontend/src/BoardPage.tsx:305-308 (onSaved does setEditBug(null)) |
| 27 | confirmed | medium | exploratory | Clicking two rows on a slow network opens the second bug, then silently swaps the modal to the first and discards what the user typed | Charter N1/N2: out-of-order responses. No spec says what happens when row opens overlap. | frontend/src/BoardPage.tsx:114-124 (handleRowClick sets whichever GET response arrives last; no loading state) |
| 28 | confirmed | medium | exploratory | When the API fails, the board says 'No bugs.'; failed row opens and failed refreshes after a successful save give no feedback | Charter N7: backend error on read paths. Spec 07 defines the empty-board message for an empty list; a failed load is not specified. | frontend/src/BoardPage.tsx:126-142 (fetchBugs ignores !res.ok and has no catch; loading ends with bugs=[]), 114-124 (handleRowClick swallows errors) |
| 29 | confirmed | medium | functional | Shipped BoardPage 'Logout' and 'New Bug' locators are not exact, so any bug whose title contains those words breaks 20 tests | specs/engineering/test-automation-patterns.md (independent tests, no shared state); run rule: other agents change data concurrently | tests/pages/board-page.ts:44-45 |
| 30 | confirmed | medium | security | Logout is client-only: nothing is invalidated server-side and the stored value replays | 05-logout.md 'close my session and prevent other users from using my credentials'; ASVS 3.3.1 | frontend/src/auth.tsx:62-65 |
| 31 | confirmed | medium | security | No rate limiting or lockout on POST /api/login | OWASP A07, ASVS 2.2.1 (anti-automation on authentication) | backend/src/index.ts:37 |
| 32 | confirmed | medium | security | Non-string login fields and malformed or oversized bodies return HTML stack traces with absolute paths | OWASP A05, ASVS 7.4.1 (generic error messages); ASVS 5.1.3 (input validation) | backend/src/index.ts:38-40, backend/src/authService.ts:19 |
| 33 | confirmed | medium | security | Backend listens on all interfaces (*:3002) while the UI binds to loopback only | OWASP A05 (security misconfiguration); aggravates security-01 | backend/src/index.ts:184 |
| 34 | confirmed | low | a11y | Clear-search button is 22x36 px, next to the input | WCAG 2.5.8 Target Size (Minimum) | frontend/src/TitleBar.tsx:59 |
| 35 | confirmed | low | a11y | Submitting login drops focus to <body> because the fields are disabled while loading | WCAG 2.4.3 Focus Order | frontend/src/LoginPage.tsx:89,107,119 |
| 36 | confirmed | low | a11y | Page title is 'BuggyBoard' on every route | WCAG 2.4.2 Page Titled | frontend/index.html:7 |
| 37 | confirmed | low | a11y | Create/Edit validation errors are not programmatically tied to their fields | WCAG 1.3.1 Info and Relationships; 3.3.1 Error Identification | frontend/src/CreateBugModal.tsx:190; frontend/src/EditBugModal.tsx:322 |
| 38 | confirmed | low | a11y | 'BuggyBoard' heading collapses to 0 px at 640 CSS px (200% zoom) | WCAG 1.4.4 Resize Text | frontend/src/TitleBar.tsx:28-45 |
| 39 | confirmed | low | contract | Unknown /api/* paths and unsupported methods return Express's HTML 404 page, not JSON (and not 405) | Contract break: api-conventions.md reserves /api for the API; responses under it should be JSON. Wrong method on a known path is 404 rather than 405. | backend/src/index.ts:184 (no /api fallback before app.listen) |
| 40 | confirmed | low | contract | Invalid severity reports error code `blank_severity`; wrong-type fields report `blank_*` | Contract break: a client cannot tell 'critical' from ''. Non-string values are coerced to "" and reported as blank. | backend/src/index.ts:123-125, :171-173; backend/src/bugService.ts:66, :114 |
| 41 | confirmed | low | contract | bugs.spec.ts pins blank and missing state as `invalid_state`, fixing the inconsistent error vocabulary as correct | Contract break (vocabulary): other fields report missing/blank as blank_<field>; a test that pins the inconsistency makes it the contract. | tests/api/bugs.spec.ts:99-107; backend/src/index.ts:133-134 |
| 42 | confirmed | low | contract | The contract differs between the Vite proxy and the backend for OPTIONS and path case | Contract break: the same request should get the same status and shape on http://localhost:5173/api and on :3002. | frontend/vite.config.ts:7-12; backend/src/index.ts:13-21 |
| 43 | confirmed | low | data | Create/update responses echo the input instead of the stored row; lone surrogates read back as U+FFFD | A bug reads back exactly as written; the 201/200 body should reflect what was persisted. | backend/src/bugService.ts:76, backend/src/bugService.ts:123 |
| 44 | confirmed | low | data | No field length limits; oversize body fails with an HTML 413 the UI reports as a generic error | 06-create-bug: title is a concise one-line summary; errors should tell the user what is wrong. | backend/src/bugService.ts:59, backend/src/index.ts:11, frontend/src/CreateBugModal.tsx:94 |
| 45 | confirmed | low | data | Invisible-only values (U+200B, U+2060) pass the required-field check for every field | 06-create-bug: each field is required and cannot be left blank. | backend/src/bugService.ts:60-68 |
| 46 | confirmed | low | data | After a 404 on save (bug deleted elsewhere) the board keeps listing the deleted row | Board reflects stored data; 09-edit-bug save/cancel semantics. | frontend/src/EditBugModal.tsx:159 |
| 47 | confirmed | low | exploratory | Oversized or malformed body gets an HTML error page from the API; the modal shows only a generic 'Failed to save bug.' | Charter C8: the backend rejects a request while a modal is open. No field length limits are specified. | backend/src/index.ts:10 (express.json() default 100kb limit, no JSON error handler); frontend/src/CreateBugModal.tsx and EditBugModal.tsx (no maxLength) |
| 48 | confirmed | low | exploratory | No title length limit, and a long unbroken title pushes the Owner column off-screen | Charter C7: long titles in the table layout. | frontend/src/BoardPage.tsx:292 (title <td> has no wrapping rule); backend/src/bugService.ts:61 (no max length) |
| 49 | confirmed | low | exploratory | No bug URL, and browser Back with a modal open leaves the board and silently discards the draft | Charter C5: deep links and Back/Forward through modals. Vision lists a 'Bug view' but it has no route. | frontend/src/App.tsx:22-34 (only /, /login, /board; modal and search state not in the URL); frontend/src/LoginPage.tsx:35 (ignores location.state.from) |
| 50 | confirmed | low | exploratory | Reopening the create modal paints the previous draft and errors for one frame; keys typed in that frame are appended to the old draft (lead's P-1) | Charter N5 (rapid open/close). Lead's planning finding P-1 (specs/testing/create-bug-test-plan.md 1.5). This is the same root cause as functional-04, which is filed as hardening. | frontend/src/CreateBugModal.tsx:32-42 (state reset in useEffect; the component stays mounted and returns null when closed, so the old state survives until the effect runs) |
| 51 | potential | medium | a11y | Escape meant for a native <select> popup closes the whole Create/Edit modal and discards input | WCAG 2.1.1 Keyboard; 3.3.4 Error Prevention (data loss) | frontend/src/CreateBugModal.tsx:44-54; frontend/src/EditBugModal.tsx:73-86 |
| 52 | potential | low | contract | Whitespace-only password is treated as a real password (401) rather than blank (400 blank_password) | Business rule, ambiguous: 03-login.md requires a blank-password error and specifies trimming only for the username. | backend/src/authService.ts:21, :27 |
| 53 | potential | low | data | Bugs created before track() (UI creates, negative POSTs) leak if the test fails first | tests/fixtures/bug-api.ts:5: every bug tests create is deleted afterwards. | tests/create-bug/create-bug.spec.ts:38-41, tests/create-bug/create-bug.spec.ts:56-59, tests/bug-status/bug-status.spec.ts:13-15, tests/api/bugs.spec.ts:38,46,57, tests/create-bug/create-bug.spec.ts:73,88,121,132 |
| 54 | gap | medium | a11y | Specs contain no accessibility requirement | specs/design/theme.md 'Other UI/UX' (accessibility placeholder); WCAG 2.2 AA used as authority | specs/design/theme.md:20 |
| 55 | gap | medium | security | Specs contain no security requirements (API authentication, session, password storage, brute-force) | Missing requirement: specs/features/02,03,05 describe only UI-level login/logout | specs/features/03-login.md, specs/features/05-logout.md, specs/features/02-user-accounts.md |
| 56 | gap | low | contract | API tests now exist, but there is still no written API contract | Every endpoint's statuses and body shapes should be documented; api-conventions.md states only the /api prefix. | specs/engineering/api-conventions.md |
| 57 | gap | low | contract | tests/api leaves several reproducible contract breaks unguarded, including PUT /api/bugs/<id>abc overwriting a real bug | Every known break should have a test (a test.fail guard at minimum) so a fix or a regression is noticed. | tests/api/id-parsing.spec.ts; tests/api/error-bodies.spec.ts; tests/api/login.spec.ts |
| 58 | gap | low | data | Persistence across a backend restart not demonstrated | tech-stack: single SQLite file at backend/data/buggyboard.db; 13-bug-status: state is stored in the database. | backend/src/db.ts:14-15 |
| 59 | gap | low | exploratory | Owner is free text: non-existent users and case variants ('Buggy' vs 'buggy') are stored as different owners | Charter C6. Spec 06 defines owner as 'the name of the user who owns the bug' but doesn't say whether it must be a real user or how case is handled. | backend/src/bugService.ts:62 (owner only trimmed) |
| 60 | gap | low | exploratory | Search does not fold accents: 'unicode' does not find 'Ünïcödé' | Charter N6: many long titles with sort and search. Spec 11 requires case-insensitive, whitespace- and punctuation-normalised matching but says nothing about diacritics. | frontend/src/BoardPage.tsx:42-46 (normalizeForSearch has no NFD/diacritic strip) |
| 61 | gap | low | functional | Empty-board and all-open-board scenarios cannot be run against the shared database | specs/features/07-bug-board.md Scenario: Board page shows an empty table when there are no bugs; specs/features/13-bug-status.md Scenario: No bugs matched message when selected state has no bugs | frontend/src/BoardPage.tsx:249-260; tests/bug-board/bug-board.spec.ts:39; tests/bug-status/bug-status.spec.ts:113 |
| 62 | gap | low | functional | Two shipped tests assert less than their titles or scenarios claim | specs/features/02-user-accounts.md (default user buggy with password 1970beetle); specs/features/12-delete-bug.md Scenario: Canceling the confirmation modal leaves the bug intact ("And the board still displays the bug") | tests/user-accounts/users-file.spec.ts:16; tests/delete-bug/delete-bug.spec.ts:42 |
| 63 | gap | low | functional | The test-plan '❌ gap' rows behave correctly today but are still not guarded in tests/ | specs/testing/create-bug-test-plan.md 1.2, 1.3 (default MID), 2.4, 2.5, 2.6, 4.4, 5.1, 5.2, 6.1, 6.2; edit-bug-test-plan.md 1.2, 2.3, 2.4, 3.4, 5.1 (UI); delete-bug-test-plan.md 1.3, 1.4, 2.3; spec 13 design (sorting/search unchanged across state filters) | tests/create-bug, tests/edit-bug, tests/delete-bug, tests/bug-status |
| 64 | hardening | low | a11y | Login page has no main landmark and 'Log in' is a paragraph, not a heading | WCAG 1.3.1 Info and Relationships (best practice) | frontend/src/LoginPage.tsx:58-71 |
| 65 | hardening | low | a11y | Route changes (login -> board, logout -> login) are silent and leave focus on <body> | WCAG 2.4.3 Focus Order; 4.1.3 (best practice for SPAs) | frontend/src/App.tsx; frontend/src/LoginPage.tsx |
| 66 | hardening | low | a11y | Firefox: table scroll container is an unnamed Tab stop | WCAG 4.1.2 Name, Role, Value; 2.4.3 | frontend/src/BoardPage.tsx:188 |
| 67 | hardening | low | contract | A JSON body sent without Content-Type: application/json is silently read as empty and reported as blank fields | Contract break (minor): a body the server will not parse should be 415, not a misleading validation error. | backend/src/index.ts:11 |
| 68 | hardening | low | contract | No length limit on title or description: a 10,000-character title and a 90 KB description are accepted with 201 | Business rule (not specified): 06-create-bug.md sets no maximum. The only limit is body-parser's 100 KB, which answers with an HTML 413. | backend/src/bugService.ts:60-68, :107-117 |
| 69 | hardening | low | data | Concurrent edits: last write wins with silent lost update | 09-edit-bug Out of Scope: conflict detection (last write wins). | backend/src/bugService.ts:119 |
| 70 | hardening | low | exploratory | Create submit handler has no in-flight guard; two submits in one task create duplicate bugs | Charter C4: rapid double-click on Save, or Enter held down. | frontend/src/CreateBugModal.tsx:56 (handleSubmit doesn't check `loading`; only the button's disabled attribute protects it) |
| 71 | hardening | low | functional | Create-bug modal first renders the previous draft (and a blank Owner), then resets after paint, so early input is overwritten | specs/features/06-create-bug.md Scenario: Create-bug modal defaults owner to the current user; specs/testing/create-bug-test-plan.md 1.5 (P-1) | frontend/src/CreateBugModal.tsx:32-42 |
| 72 | hardening | low | security | Missing security headers and X-Powered-By: Express on API responses | OWASP A05, ASVS 14.4 (CSP, X-Content-Type-Options, frame-ancestors, Referrer-Policy); ASVS 14.3.3 | backend/src/index.ts:11-21 |
| 73 | hardening | low | security | Lax bug-id parsing: '1 OR 1=1', '1;DROP TABLE bugs', '1.9', '1e3' resolve to bug 1 | ASVS 5.1.3 (strict input validation) | backend/src/index.ts:81,95,140 |
| 74 | hardening | low | security | No per-field length limit: a 90 KB title is stored and rendered | ASVS 5.1.4 (field length validation); bounded resource use | backend/src/bugService.ts:59-78 |
| 75 | hardening | low | security | Committed quality reports publish the local home path, OS username and full server stack traces | OWASP A05 / ASVS 7.4.1 intent (no internal detail disclosure); data in a place it should not be | quality-report/quality-data.json, quality-reports/2026-09-22T205320Z/evidence/security/login-probe.txt, evidence/security/resource-probe.txt, evidence/contract/400-malformed-json.html, evidence/contract/500-login-username-number.html, findings/security.json, findings/functional.json, evidence/functional/run-log.txt, prompt.md |
| 76 | hardening | low | security | users.json stores passwords in plaintext and login compares them with !== | ASVS 2.4.1 (L2: passwords stored with an approved one-way hash); OWASP A02/A07 | users.json, backend/src/authService.ts:33 |
| 77 | fixed | medium | functional | No feature in specs/features/ has automated product coverage in tests/ | specs/engineering/test-automation-patterns.md; all Scenarios in specs/features/01-13 | tests/ |
| 78 | fixed | medium | security | Diff adds a plaintext password (matt / <redacted>) to tracked users.json | OWASP A02/A07, ASVS 2.4.1 (passwords stored with an approved one-way hash); 02-user-accounts.md requires users.json but not plaintext | users.json:10-13, backend/src/authService.ts:33 |

### Not tested

- **a11y** — axe-core: not installed (@axe-core/playwright absent), so not run; no packages added
- **a11y** — Real screen readers (VoiceOver, NVDA, JAWS): announcement wording, virtual-cursor behaviour with two aria-modal dialogs, whether role=alert errors are read
- **a11y** — WebKit/Safari keyboard behaviour (Tab skips buttons by default); the Firefox walk is headless Playwright Firefox, not a desktop profile
- **a11y** — Real browser zoom (320/640 CSS px viewports emulated instead); 1.4.12 was checked only for clipping at 1280 px
- **a11y** — Real Windows High Contrast (forced-colors only emulated in Chromium)
- **a11y** — Native <select> popups in headed browsers (a11y-19 needs a manual check)
- **a11y** — Mobile touch and screen-reader gestures; speech-input (voice control) name collisions only inferred from the accessibility tree
- **contract** — Baseline origin/main was not run. The diff has no backend change, so every finding is attributed as pre-existing by reading the code.
- **contract** — Authentication on bug routes and X-Powered-By: owned by security; tests/api/auth.spec.ts guards them with test.fail. Not re-filed here.
- **contract** — The security rating for stack traces in error pages (contract-01/02) belongs to security.
- **contract** — Concurrent writes, unicode/control characters in fields, and ETag/If-None-Match conditional requests (ETag is present on GET).
- **contract** — Backward compatibility: there is no versioned contract or consumer to compare against.
- **contract** — No new Playwright tests were written. The dispatch forbids changes under tests/; contract-09 lists the guards to add.
- **data** — Persistence across backend restart (restart forbidden; data-08)
- **data** — Schema migration safety and backup/restore (no mechanism by design)
- **data** — data-04 UI error message re-drive (API re-tested; no app change since last run)
- **data** — Second browser session as vanny for concurrency (parallel API clients used)
- **data** — Bidi override U+202E and C0 controls are stored and rendered verbatim at all layers (integrity OK); display spoofing is a security question, left to security
- **data** — Which full-suite run created the pre-existing U+200B rows (lead's full-suite.txt in evidence/lead is empty)
- **exploratory** — Real slow or flaky networks, and browsers other than headless Chromium (Firefox, WebKit, real mobile and touch input). Latency was simulated only with page.route delays.
- **exploratory** — True browser zoom. CSS zoom on body gave inconclusive numbers, so a 320px viewport stood in for 400% zoom.
- **exploratory** — Screen readers and IME/composition input during the P-1 frame.
- **exploratory** — Concurrent writes racing inside SQLite. Every race tested here is client-side.
- **exploratory** — Hand-off to a11y, not filed: the keyboard-only journey (N3) completes create, edit and delete. But focus drops to <body> after every close, the delete confirm opens with focus left behind it (4 Tabs to reach its Delete), and with Save disabled on an unchanged edit, Tab leaves the modal for the page behind. In an early N3 run, 8 Tabs then Enter from an unchanged edit modal ended on the login page (the Tabs went through the header to Logout), which discarded the edit. At 375px (phone), not just 320px, the header is 524px wide with Logout off-screen (N4-board-375-phone.png). These add evidence to the existing a11y focus-trap, focus-return, confirm-focus and reflow findings.
- **exploratory** — Hand-off to functional, not filed separately: specs 06 and 09 say Escape equals Cancel, but Escape works while Cancel is disabled during Saving (exploratory-10 part a).
- **exploratory** — exploratory-09 has the same root cause as functional-04. Merge them, keeping the more precise evidence (input is merged into the stale draft, not overwritten).
- **functional** — Firefox and WebKit: only Chromium was run (--workers=1)
- **functional** — 01 favicon art style (tan cartoon 1970 Beetle) and the 08 'HIGH more prominent' visual judgement
- **functional** — 07 empty board and the exact precondition of 13-S7 (every bug open): shared DB, see functional-03
- **functional** — 06/09 blank-severity outline rows through the UI: the dropdown has no blank option (API 400 checked by the shipped suite)
- **functional** — Search performance while typing (11 design note)
- **functional** — Board counts and totals were never asserted, because other agents write to the same DB
- **functional** — Test-plan rows marked 'fails today' (create 5.3 double submit, delete 1.5 focus, delete 3.1 stale row, edit 2.5 multi-line title) and hold rows (create 2.7, edit 5.2): owned by exploratory, a11y and data, and not re-measured here
- **functional** — Full shipped suite: not re-run (the lead owns it); only the four spec folders above were run, for functional-05
- **security** — TLS, HSTS, cookie flags and production headers: local dev server over plain HTTP, no cookies are issued, and the Vite dev document headers are not production headers
- **security** — PR #1 on github.com/matthewtingey1/buggyboard-web-app: not queried (instructed); assessed from local refs, where origin/e2e-suite-and-quality-run == HEAD ffb95fd plus the force-pushed-over f296bf0 from the reflog. Commits pushed from another clone would not be visible
- **security** — Off-host reachability of *:3002 (localhost-only rule)
- **security** — Authorization / per-user ownership: deliberately unowned, no role model
- **security** — Statistically meaningful timing oracle: plaintext !== compare means no hashing-cost difference; response bodies are identical
- **security** — Sustained brute force or flooding beyond 30 login attempts (shared server)
- **security** — XSS in the delete confirmation with <script>/<svg> payloads: guarded for <img onerror> by tests/security/security.spec.ts; frontend/src has no dangerouslySetInnerHTML or innerHTML
- **security** — quality:run / quality:summary execute scripts from $HOME/.claude/skills (outside the repo, untracked); not run and not reviewed, since they are the release lead's tooling
- **security** — test-history/ output from archive-reporter: gitignored (/test-history/); it records test titles, absolute file paths and argv, but no credentials were seen in the reporter code
<!-- findings:end -->
