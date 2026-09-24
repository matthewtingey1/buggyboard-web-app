# Exploratory report: run 2026-09-22T222029Z

**Verdict:** ready-with-known-risk. **Confidence:** medium.

Nothing blocks a journey. The new risks all come from timing. A response that arrives late, out of order or not at all acts on whatever modal is open by then, or tells the user there are no bugs. All eight findings from last run still reproduce, and the lead's P-1 holds with one correction.

Every record carried the `[exploratory]` prefix and all were deleted (cleanup: 0 remain). Scripts, session logs and screenshots are in `evidence/exploratory/`.

## Re-test of the previous run

| id | Result | This run's evidence |
|---|---|---|
| exploratory-01 lost update | reproduces | buggy closed; vanny's stale description save reverted it to OPEN |
| exploratory-02 deleted elsewhere | reproduces | 'Bug not found.', stale row kept, clicking it does nothing |
| exploratory-03 multi-tab logout | reproduces | logged-out tab created #3249 as buggy |
| exploratory-04 HTML 413 | reproduces | 413 `<!DOCTYPE html>`, UI shows 'Failed to save bug.' |
| exploratory-05 long title | reproduces | table 4529px in an 894px container; 20k title accepted |
| exploratory-06 double submit | reproduces | two synchronous clicks created 2 bugs |
| exploratory-07 owner free text | still open (gap) | 'nobody-such-user' and 'Buggy' stored as sent |
| exploratory-08 Back discards the draft | reproduces, extended | Back leaves to about:blank. New: Back or reload during a pending save gives no warning and the bug is never saved |

## Lead's P-1: confirmed as exploratory-09, with one correction

A requestAnimationFrame probe shows the previous title and 'Description is required.' in the frame before the first paint after reopening. The next frame is clean. Typing in that frame is **not lost but merged**: previous draft `OLD` plus `new` typed at 0ms gave `OLDnew` in 5/5 runs, and waits of 16ms or more gave `new`. The root cause is the same as functional-04, so merge the two.

## Charters (ranked by risk), session logs

**N1: Slow network during save and delete (Escape while pending). Result: exploratory-10.**
Responses were held 2.5s after the server had processed the request. Escape closes the modal during 'Saving…' even though Cancel is disabled. The late response then closes the next Create draft, or the next bug's Edit modal. A save that fails after Escape shows no error at all, or the error appears under an unrelated new draft. During 'Deleting…', Escape dismisses the confirm and the fields stay editable, but Save stays disabled and the delete completes.

**N2: Out-of-order responses when opening rows. Result: exploratory-11.**
Row A's GET was slow; the user clicked A, then B. B's modal opened and the user typed into it, then the modal turned into A and the typing was gone. Nothing shows the user that a row open is pending.

**N7: Backend failure on read paths. Result: exploratory-12.**
A 500 or a refused connection on the list renders 'No bugs.'. A failed row open does nothing. A successful create followed by a failed refresh closes the modal and hides the new bug.

**N8: Back and reload during a pending save. Result: extends exploratory-08.**
There is no beforeunload guard. The request held in the browser was dropped and the bug was not saved.

**N3: Keyboard-only create, edit and delete. Result: journey completes; hand-off to a11y.**
New Bug is 2 Tabs from load, and Enter in the form submits. State can be changed by type-ahead, Save is 5 Tabs from State, Delete is 5 from Title, and the confirm's Delete is 4 Tabs away. After every close, focus drops to `<body>`, and it takes 10 Tabs to get from search back to a row. On an unchanged edit, Save is disabled, so Tab leaves the modal for the header. One early run ended on the login page this way and lost the edit. These are consequences of existing a11y findings (focus trap, focus return, confirm focus), so they are not filed again.

**N4: Viewports 1280, 768, 375 and 320. Result: hand-off to a11y (reflow).**
At 1280 and 768 the layout fits. At 375 and at 320 the header is 524px wide, so the page scrolls sideways and Logout sits off-screen. The modals fit at every width and Save stays reachable.

**N5: Rapid open and close. Result: fine apart from P-1.**
40 Create open/Escape cycles and 20 Edit cycles left no stuck dialogs and no page errors. Double-clicking a row fires 2 GETs but opens 1 modal. Two Escapes from the confirm close both dialogs and delete nothing. Five Enters on Delete open a single confirm and delete nothing.

**N6: 200 bugs with long titles, with search and sort together. Result: exploratory-13 (gap).**
The board loaded 210 rows in 43ms and 11 characters of search took 101ms. Sort order was correct, and sort and search both survived an edit. The only miss is that accents are not folded ('unicode' does not match 'Ünïcödé').

## Findings

| id | title | severity | status |
|---|---|---|---|
| exploratory-01 | Concurrent edits silently overwrite (lost update) | high | confirmed |
| exploratory-02 | Bug deleted elsewhere leaves a dead row and 'Bug not found.' | medium | confirmed |
| exploratory-03 | Logout and user switch don't reach other tabs | medium | confirmed |
| exploratory-04 | Oversized or malformed body gets HTML error; UI says only 'Failed to save bug.' | low | confirmed |
| exploratory-05 | No title length limit; unbroken title pushes Owner off-screen | low | confirmed |
| exploratory-06 | Create submit has no in-flight guard | low | hardening |
| exploratory-07 | Owner is free text | low | gap |
| exploratory-08 | No bug URL; Back discards the draft; no guard during a pending save | low | confirmed |
| exploratory-09 | Create modal paints its previous draft for one frame; early keys merge into it (P-1) | low | confirmed |
| exploratory-10 | Escape ignores the Saving lock; late response closes the next draft; failed save is silent | medium | confirmed |
| exploratory-11 | Overlapping row opens swap the modal to another bug and discard the typing | medium | confirmed |
| exploratory-12 | API failure shows 'No bugs.'; failed opens and refreshes give no feedback | medium | confirmed |
| exploratory-13 | Search does not fold accents | low | gap |

## Hand-offs

- **functional:** specs 06 and 09 say Escape equals Cancel, but Escape works while Cancel is disabled (exploratory-10a). exploratory-09 has the same root cause as functional-04.
- **a11y:** the N3 and N4 evidence above adds to the focus-trap, focus-return, confirm-focus and 320px reflow findings. The reflow failure also appears at 375px.

## Not covered

Real slow or flaky networks (simulated only with route delays), Firefox, WebKit, real mobile and touch, true browser zoom, screen readers, IME input, and write races inside SQLite.
