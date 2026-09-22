# Test plan: create a bug

**Seed:** `tests/seed.spec.ts` (logged in as `matt`, board loaded).
**Authority:** `specs/features/06-create-bug.md`, plus `13-bug-status.md` for the initial state.
**Explored:** 2026-09-22, headless Chromium, from the seed state.
**Generated:** 2026-09-22 with `/playwright-cli` (seed attached via `--debug=cli`); every gap row is now a test in the file named in its row. 🔒 means a known defect pinned with `test.fail`; none remain in this plan.

Every test starts from the seed, opens the modal with **New Bug**, and waits until the modal settles (Title empty, Owner = `matt`) before typing. Bugs a test creates are titled with the `[e2e]` prefix and a unique token, and are deleted afterwards. No test asserts board totals.

> **Settle wait:** tests wait for the Owner default before typing. The one-frame stale draft that made this necessary (P-1) was fixed on 2026-09-22, and 1.5 now guards it.

## Opening the modal

| #   | Test                                                     | Steps                         | Expected                                                                      | Automated                                              |
| --- | -------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1.1 | Modal shows every field and button                       | Click New Bug                 | Dialog "Create bug" with Title, Severity, Owner, Description, Save, Cancel, X | ✅ `create-bug.spec.ts`                                |
| 1.2 | Title has focus on open                                  | Click New Bug                 | Focus is in Title                                                             | ✅ `create-bug-plan.spec.ts`                           |
| 1.3 | Severity defaults to MID, options HIGH/MID/LOW, no blank | Click New Bug                 | Value `mid`; options in that order                                            | ✅ (options), ✅ default MID `create-bug-plan.spec.ts` |
| 1.4 | Owner defaults to the current user                       | Click New Bug                 | Owner = `matt`                                                                | ✅ (as buggy)                                          |
| 1.5 | Reopening starts clean                                   | Type in Title, Escape, reopen | Title empty, no errors, from the first frame                                  | ✅ `create-bug-plan.spec.ts` (P-1 fixed 2026-09-22)    |

## Saving

| #   | Test                                       | Steps                                      | Expected                                                  | Automated                              |
| --- | ------------------------------------------ | ------------------------------------------ | --------------------------------------------------------- | -------------------------------------- |
| 2.1 | Save persists all fields and closes        | Fill all, Save                             | Modal closes; API has title, severity, owner, description | ✅                                     |
| 2.2 | New bug is OPEN                            | Save a bug                                 | API state `OPEN`; row listed under Open                   | ✅ `bug-status.spec.ts`                |
| 2.3 | New bug appears without reload             | Save a bug                                 | Row visible immediately                                   | ✅                                     |
| 2.4 | Enter in Title submits                     | Fill all, press Enter in Title             | Modal closes; bug saved                                   | ✅ `create-bug-plan.spec.ts`           |
| 2.5 | Leading and trailing whitespace is trimmed | Title/Owner/Description padded with spaces | Row and API show trimmed values                           | ✅ `create-bug-plan.spec.ts`           |
| 2.6 | Save shows progress and locks the form     | Delay POST ~800 ms, Save                   | Button reads "Saving…"; fields disabled                   | ✅ `create-bug-plan.spec.ts`           |
| 2.7 | Owner may be any text                      | Owner `nobody-real`, Save                  | Accepted (no rule in spec 06)                             | ⏸ hold until the owner rule is decided |

## Cancelling

| #   | Test                                        | Steps                                       | Expected                                    | Automated |
| --- | ------------------------------------------- | ------------------------------------------- | ------------------------------------------- | --------- |
| 3.1 | Cancel discards                             | Fill, Cancel                                | Closes; nothing saved                       | ✅        |
| 3.2 | X discards                                  | Fill, X                                     | Closes; nothing saved                       | ✅        |
| 3.3 | Escape discards                             | Fill, Escape (focus in any field or button) | Closes; nothing saved                       | ✅        |
| 3.4 | Backdrop click keeps the modal and its data | Fill, click the backdrop                    | Still open; values preserved; nothing saved | ✅        |

## Validation

| #   | Test                                    | Steps                                  | Expected                                                                                         | Automated                    |
| --- | --------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------- |
| 4.1 | All blank names each field              | Clear Owner, Save                      | Alert lists "Title is required.", "Owner is required.", "Description is required." in that order | ✅                           |
| 4.2 | Each whitespace-only field blocks save  | Outline over Title, Owner, Description | Stays open; alert shown; nothing saved                                                           | ✅                           |
| 4.3 | Severity cannot be blank                | Inspect options; POST blank severity   | No blank option; API 400                                                                         | ✅                           |
| 4.4 | Errors clear when the modal is reopened | Trigger errors, Escape, reopen         | No alert                                                                                         | ✅ `create-bug-plan.spec.ts` |

## Failure handling

| #   | Test                             | Steps                          | Expected                                              | Automated                                                                                       |
| --- | -------------------------------- | ------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 5.1 | Server rejection keeps the draft | 120,000-char description, Save | Alert shown; modal open; text kept                    | ✅ `create-bug-plan.spec.ts`; the alert now gives the reason ("The request body is too large.") |
| 5.2 | Network failure keeps the draft  | Abort POST /api/bugs, Save     | "Something went wrong. Please try again."; modal open | ✅ `create-bug-plan.spec.ts`                                                                    |
| 5.3 | Double submit creates one bug    | Two synchronous submits        | Exactly one bug saved                                 | ✅ `create-bug-plan.spec.ts` (exploratory-06 fixed 2026-09-22)                                  |

## Interaction with the board

| #   | Test                          | Steps                       | Expected                                        | Automated                    |
| --- | ----------------------------- | --------------------------- | ----------------------------------------------- | ---------------------------- |
| 6.1 | Creating from the Closed view | Select Closed, create a bug | Saved as OPEN; not shown until Open is selected | ✅ `create-bug-plan.spec.ts` |
| 6.2 | Active search is kept         | Search, create a bug        | Search text unchanged after save                | ✅ `create-bug-plan.spec.ts` |

## Removed after review

- **Per-severity colour of the selected option.** It's already asserted in the create modal and in spec 08's board tests; a third copy adds nothing.
- **Creating as each user.** Owner pre-fill is one code path; one user covers it, and login per user is covered in `tests/login/`.

## Findings from exploration

- **P-1 (low, fixed 2026-09-22):** Reopening the create modal shows the previous draft and any errors for one frame, then clears them. Typing during that frame is lost. This is the same draw-then-reset cause as functional-04 (`CreateBugModal.tsx` resets state in `useEffect` after paint).
- Escape was retested with focus on every control, with and without validation errors, in Chromium and Firefox. It always closes the modal.
