# Exploratory report — run 2026-09-22T205320Z

**Verdict:** ready-with-known-risk. **Confidence:** medium (headless Chromium only; one pass per charter).

The diff (port change, new user, Playwright dependency) touches no product code. None of the risks below are regressions; they are long-standing gaps in multi-user and error paths. The one that loses data is exploratory-01.

## Findings

| id | title | severity | status |
|---|---|---|---|
| exploratory-01 | Concurrent edits silently overwrite: a stale edit modal reverts another user's change | high | confirmed |
| exploratory-02 | Bug deleted elsewhere stays on the board; Save/Delete show "Bug not found."; the row click does nothing | medium | confirmed |
| exploratory-03 | Logout or user switch in one tab doesn't reach other tabs (they keep writing, owner defaults to the old user) | medium | confirmed |
| exploratory-04 | Oversized or malformed body gets an HTML error page; the modal shows a generic "Failed to save bug." | low | confirmed |
| exploratory-05 | No title length limit; a long unbroken title pushes Owner off-screen | low | confirmed |
| exploratory-06 | Create submit has no in-flight guard (two submits in one task make duplicates) | low | hardening |
| exploratory-07 | Owner is free text: non-existent users and case variants accepted | low | gap |
| exploratory-08 | No bug URL; Back with a modal open leaves the board and drops the draft | low | confirmed |

Full evidence, repro steps and fixes are in `findings/exploratory.json`.

## Charters and session logs

Charters were ranked by risk and time-boxed to about 10 minutes each. Raw per-run logs are in `evidence/exploratory/session-log-*.json`, merged in `session-logs-merged.json`, with screenshots in `evidence/exploratory/screenshots/`. Script: `evidence/exploratory/explore.mjs`.

- **C1: delete in one session while the bug is open in another (buggy + vanny).** Save gave "Bug not found." and the modal stayed open. After Cancel the dead row was still on the board, and clicking it did nothing. Deleting an already-deleted bug behaved the same way. Filed as exploratory-02.
- **C2: two users edit the same bug.** buggy closed it and vanny then saved a description change, which reopened it. Filed as exploratory-01.
- **C3: logout or user switch across tabs.** The second tab stayed authenticated and created a bug. After tab 1 switched to vanny, tab 2 still pre-filled owner=buggy. Filed as exploratory-03.
- **C4: double submit.** A real dblclick and repeated Enter each created one bug (the disabled button re-renders in time). A synchronous double click or requestSubmit created two. Filed as exploratory-06 (hardening).
- **C5: deep links and Back/Forward.** /board/1, /bugs/1 and /nope all redirect to /board silently. /BOARD works because routes are case-insensitive. Back with a modal open leaves the page. Search and filter are lost on reload, and the post-login redirect ignores the requested URL. Filed as exploratory-08.
- **C6: owner and username variants.** Login is case-sensitive but trims the username. Owner accepts anything. Case variants show up as separate owners when sorted. One early run showed an empty default owner after a padded-username login; a rerun with a wait (`recheck-c6.mjs`) showed `buggy`, so that was a test timing artifact and isn't filed. Filed as exploratory-07.
- **C7: long titles and 200 bugs.** Creating 200 bugs took 0.7 s and rendering them about 13 ms. There is no pagination, which is fine at this size. An unbroken 400-char title overflows the table, and the API accepts a 20k-char title. Filed as exploratory-05.
- **C8: backend rejection while a modal is open.** A 120k description got a 413 with an HTML body, and the UI showed "Failed to save bug.". Malformed JSON got a 400 with an HTML body. Filed as exploratory-04.

## Hand-offs (these are specified, or belong to another agent)

- security: /api/bugs has no server-side authentication (the root cause behind exploratory-03).
- contract: the 400 and 413 responses are HTML, not the JSON error shape.
- functional: spec 05 ("no longer authenticated") doesn't say what should happen with several tabs open.

## Cleanup

Every record carried the `[exploratory]` prefix. `cleanup.mjs` deleted 227; 0 remain (`evidence/exploratory/cleanup.log`). No other data was touched.

## Not covered

Other browsers, mobile, slow networks and assistive technology. True simultaneous writes at the SQLite level (C2 was sequential). The delete-confirm dialog with a huge title.
