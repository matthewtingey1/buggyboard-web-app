# Exploratory — 2026-09-22T230611Z

**Verdict:** ready-with-known-risk. **Confidence:** medium.

Most of the previous run's findings are fixed: 02, 03, 04, 06, 09 and 11. Two are fixed only in part: 05 (overflow fixed, still no length limit) and 12 (load errors fixed, row-open errors still invisible). 10 is fixed for Escape only, because the header Close (x) button reopens the same hole. 01, the lost update (high), still reproduces.

The new charters found three medium defects in the new code:
- Stacked dialogs from a slow row open (14).
- Out-of-order board refreshes that bring a deleted bug back (15).
- A login lockout that any third party can trigger (16).

API health was checked first: `BuggyBoard API is running`. Everything ran headless in Chromium. The scripts, session logs and screenshots are in `evidence/exploratory/`. 27 `[exploratory]` bugs were created and all were deleted.

## Carry-forward (previous run 2026-09-22T222029Z)

| id | result | what I saw this run |
|---|---|---|
| 01 | still reproduces | buggy closed the bug; vanny's stale description save set it back to OPEN |
| 02 | fixed | the stale row is removed on 404; clicking a deleted row refreshes the board |
| 03 | fixed | tab 2 follows logout to /login, and follows the switch to vanny back to /board with owner defaulting to vanny |
| 04 | fixed | 413 and 400 now return JSON, and the modal shows 'The request body is too large.' |
| 05 | still reproduces (narrowed) | the table no longer overflows (894 = 894), but a 20k title is still accepted and its row is 9,649px tall |
| 06 | fixed | two synchronous Save clicks create 1 bug |
| 07 | gap, still open | 'nobody-such-user' and 'Buggy' are stored as sent |
| 08 | still reproduces | Back with a draft open loses the draft; /board/1 gives no modal |
| 09 | fixed | typing 'new' at once after reopening gave 'new' 5 out of 5 times, with a clean first frame |
| 10 | still reproduces (narrowed) | Escape is now blocked while saving and deleting, but the header x is not (N1) |
| 11 | fixed | a late response for row A no longer replaces B's modal |
| 12 | still reproduces (narrowed, now low) | the load-error state and Try again work; a failed row open is announced only in the sr-only status |
| 13 | gap, still open | 'unicode cafe' finds 0 rows for 'Ünïcödé café' |

## Charters (ranked by risk before starting)

**N1: can the Saving/Deleting lock be bypassed some other way?** The header Close (x) stays enabled while Cancel is disabled.
- A late POST success closed a second, half-typed draft.
- A late 500 put 'Simulated server error' into an unrelated new draft.
- A late PUT for bug A closed bug B's modal and threw away B's typing.
- The confirm-delete x dismissed the confirm during 'Deleting…' and left the edit form editable.

Result: exploratory-10 still reproduces. Shots `N1a-*`, `N1b-*`, `N1c-*`, `N1d-*`.

**N2: a slow row open, then New Bug.** For 400ms after clicking the row there was no feedback. The user clicked New Bug and typed, and 2s later the Edit modal opened on top of Create and took focus. The next keystrokes went into the other bug's title, with Save enabled. One Escape closed the hidden Create modal (draft lost) and left Edit open, with focus behind the overlay on New Bug. Filed as exploratory-14. Shots `N2-*`.

**N3: out-of-order list refreshes.** The refresh after a create was delayed 3s, and the user deleted another bug in the meantime. The deleted bug reappeared when the late refresh landed (the server returns 404 for it). Filed as exploratory-15. Shot `N3-deleted-bug-reappears.png`.

**N4: can a third party lock a real user out?** I used a throwaway name only. 20 failures with mixed case and padding took 60ms, after which the exact name got 429, even with a blank password, so the lock is checked before credentials. 'Buggy' with the right password got 401 (one attempt), yet it counts toward buggy's lock, and the username field doesn't turn off auto-capitalise. A successful buggy login then reset the counter. Filed as exploratory-16; hand-off to security. Shot `N4-locked-login-ui.png`.

**N5: two tabs, logout and user switch mid-work.**
- Cross-tab logout and the switch to vanny work.
- A typed draft in tab 2 vanished with no warning.
- A save already in flight in tab 2 still created the bug, and tab 2 sat on /login with no message.

Filed as exploratory-17. Shot `N5-tab2-after-user-switch.png`.

**N6: focus and keyboard through the new title buttons.** These all worked:
- Focus returns to the title button after Save, and to the heading when the row leaves the view.
- The confirm opens on Cancel, and Escape on it returns focus to Delete.
- 12 Tabs stay inside the modal.
- Try again moves focus to the heading.
- Held Enter on a title opens one modal (3 GETs).

What failed: held Enter on New Bug opens the form already showing 'Title is required. Description is required.' Filed as exploratory-18. A scripted Escape-then-Enter race against the deferred focus return was not filed (see notTested). Shot `N6b-*`.

**N7: row padding versus the title button, and header wrap.** Clicks on the ID cell, the owner cell and the title padding all open the bug. A mouse drag across a title selects nothing and opens the bug, so titles can't be copied. Filed as exploratory-19. The header fits at 375 and 320px. Shots `N7-*`.

**N8: one-line titles and invisible characters.** A multi-line title POST is stored as one line; the description keeps its newlines. A zero-width-only title in Edit enables Save and gets the server's 'Title is required.' A title of only spaces in Edit disables Save with no message. That last one is a hand-off to functional. Shot `N8-zero-width-title-edit.png`.

## Findings

| id | severity | status | title |
|---|---|---|---|
| exploratory-01 | high | confirmed | Concurrent edits silently overwrite (lost update) |
| exploratory-02 | medium | fixed | Dead row after a delete elsewhere |
| exploratory-03 | medium | fixed | Logout doesn't reach other tabs |
| exploratory-04 | low | fixed | HTML error bodies and a generic save error |
| exploratory-05 | low | confirmed | No title length limit (20k title, 9,649px-tall row) |
| exploratory-06 | low | fixed | Double submit creates duplicates |
| exploratory-07 | low | gap | Owner is free text |
| exploratory-08 | low | confirmed | No bug URL; Back discards the draft |
| exploratory-09 | low | fixed | Stale draft painted on reopen |
| exploratory-10 | medium | confirmed | The header Close (x) bypasses the Saving/Deleting lock |
| exploratory-11 | medium | fixed | Row-open responses arriving out of order |
| exploratory-12 | low | confirmed | Row-open failure is only announced to screen readers |
| exploratory-13 | low | gap | Search doesn't fold accents |
| exploratory-14 | medium | confirmed | A slow row open followed by New Bug stacks Edit over Create |
| exploratory-15 | medium | confirmed | An out-of-order refresh brings a deleted bug back |
| exploratory-16 | medium | confirmed | Anyone can lock any username; case variants share the counter |
| exploratory-17 | low | confirmed | Logout in another tab silently drops drafts and in-flight saves |
| exploratory-18 | low | confirmed | Held Enter on New Bug opens the form with validation errors |
| exploratory-19 | low | confirmed | Titles can't be selected or copied with the mouse |

## Not covered

- Real networks, Firefox, WebKit, and mobile or touch input.
- A real-account lockout (forbidden by the run rules).
- Screen readers and IME input.
- Suite gap for the lead: `tests/resilience` guards Escape during a save but not the header x, and nothing asserts a visible message after a failed row open.
