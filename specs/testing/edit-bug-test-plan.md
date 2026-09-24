# Test plan: edit a bug

**Seed:** `tests/seed.spec.ts` (logged in as `matt`, board loaded).
**Authority:** `specs/features/09-edit-bug.md`, plus `13-bug-status.md` for State.
**Explored:** 2026-09-22, headless Chromium, from the seed state.
**Generated:** 2026-09-22 with `/playwright-cli` (seed attached via `--debug=cli`); every gap row is now a test in the file named in its row. 🔒 means a known defect pinned with `test.fail`; none remain in this plan.

Each test creates its own `[e2e]` bug through the API, reloads the board, and opens that bug by clicking its row. The bug is deleted afterwards.

## Opening

| #   | Test                                                     | Steps                          | Expected                                                     | Automated                  |
| --- | -------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------ | -------------------------- |
| 1.1 | Row opens "Edit bug #<id>" with the bug's data           | Click the row                  | ID, Title, Severity, State, Owner, Description match the API | ✅ `edit-bug.spec.ts`      |
| 1.2 | Title has focus on open                                  | Click the row                  | Focus is in Title                                            | ✅ `edit-bug-plan.spec.ts` |
| 1.3 | ID is read-only; the rest are editable                   | Type into ID                   | ID unchanged; other fields editable                          | ✅                         |
| 1.4 | State shows Open/Closed                                  | Open an OPEN bug               | State = Open; options Open, Closed                           | ✅ `bug-status.spec.ts`    |
| 1.5 | Opening a second bug shows its data from the first frame | Open bug A, Escape, open bug B | Title is B's immediately                                     | ✅ `edit-bug-plan.spec.ts` |

## Saving

| #   | Test                                         | Steps                                    | Expected                         | Automated                  |
| --- | -------------------------------------------- | ---------------------------------------- | -------------------------------- | -------------------------- |
| 2.1 | Save persists every edited field and closes  | Change all four, Save                    | API and row show new values      | ✅                         |
| 2.2 | Closing a bug hides it from the Open view    | State → Closed, Save                     | API `CLOSED`; row gone from Open | ✅                         |
| 2.3 | Enter in Title saves                         | Change Description, press Enter in Title | Modal closes; change saved       | ✅ `edit-bug-plan.spec.ts` |
| 2.4 | Enter in Description adds a line, not a save | Press Enter in Description               | Modal stays open                 | ✅ `edit-bug-plan.spec.ts` |

> Rows 2.5 and 2.6 were removed on 2026-09-22: the API now stores titles on one line (data-01 fixed), so a multi-line title can no longer exist. `tests/data/round-trip.spec.ts` guards that.

## Save enablement

| #   | Test                                                     | Steps                                  | Expected                                    | Automated                  |
| --- | -------------------------------------------------------- | -------------------------------------- | ------------------------------------------- | -------------------------- |
| 3.1 | Disabled with no changes                                 | Open                                   | Save disabled                               | ✅                         |
| 3.2 | Disabled again after reverting                           | Change Title, change it back           | Save disabled                               | ✅                         |
| 3.3 | Disabled when a field is blanked                         | Outline over Title, Owner, Description | Save disabled; API unchanged                | ✅                         |
| 3.4 | Trailing-space-only change does not enable Save          | Add a trailing space to Title          | Save disabled                               | ✅ `edit-bug-plan.spec.ts` |
| 3.5 | A zero-width-only field keeps Save disabled and says why | Set Title to a zero-width space        | Save disabled; "Title is required to save." | ✅ `edit-bug-plan.spec.ts` |

## Discarding

| #   | Test                                         | Steps                    | Expected               | Automated |
| --- | -------------------------------------------- | ------------------------ | ---------------------- | --------- |
| 4.1 | Cancel, X and Escape discard                 | Outline over the three   | Closes; API unchanged  | ✅        |
| 4.2 | Backdrop click keeps the modal and its edits | Edit, click the backdrop | Still open; edits kept | ✅        |

## Concurrency

| #   | Test                                  | Steps                      | Expected                                                                                           | Automated                                                     |
| --- | ------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 5.1 | Editing a bug deleted elsewhere       | Open, delete via API, Save | "Bug not found."; nothing recreated                                                                | ✅ API (`tests/data/`); ✅ UI message `edit-bug-plan.spec.ts` |
| 5.2 | Stale edit over another user's change | Two contexts edit one bug  | ⏸ hold: spec 09 says last write wins; the spec owner must decide first (exploratory-01 vs data-07) | —                                                             |

## Removed after review

- **Per-severity colour in the edit dropdown.** It's covered once per severity already, and spec 08 owns the colours.
- **Editing each field on its own.** 2.1 changes all four at once and would catch any one failing; four more tests add run time without new failure modes.
