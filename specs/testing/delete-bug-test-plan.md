# Test plan: delete a bug

**Seed:** `tests/seed.spec.ts` (logged in as `matt`, board loaded).
**Authority:** `specs/features/12-delete-bug.md`.
**Explored:** 2026-09-22, headless Chromium, from the seed state.
**Generated:** 2026-09-22 with `/playwright-cli` (seed attached via `--debug=cli`); every gap row is now a test in the file named in its row. 🔒 means a known defect pinned with `test.fail`; none remain in this plan.

Each test creates its own `[e2e]` bug through the API, opens it in the edit modal, and deletes only that bug.

## Confirmation

| #   | Test                                        | Steps                      | Expected                                                                | Automated                                               |
| --- | ------------------------------------------- | -------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| 1.1 | Edit modal shows Delete                     | Open a bug                 | Delete button visible                                                   | ✅ `delete-bug.spec.ts`                                 |
| 1.2 | Delete asks for confirmation naming the bug | Click Delete               | "Are you sure you want to delete bug #<id>: <title>?"; bug still exists | ✅                                                      |
| 1.3 | Escape closes only the confirmation         | Delete, then Escape        | Confirmation closes; edit modal stays; bug exists                       | ✅ `delete-bug-plan.spec.ts`                            |
| 1.4 | Backdrop click keeps the confirmation open  | Delete, click its backdrop | Still open                                                              | ✅ `delete-bug-plan.spec.ts`                            |
| 1.5 | Confirmation takes focus                    | Click Delete               | Focus is on the confirmation's Delete or Cancel                         | ✅ `delete-bug-plan.spec.ts` (a11y-07 fixed 2026-09-22) |

## Outcome

| #   | Test                                          | Steps                               | Expected                                    | Automated                    |
| --- | --------------------------------------------- | ----------------------------------- | ------------------------------------------- | ---------------------------- |
| 2.1 | Confirming deletes and closes both modals     | Delete, confirm                     | Both closed; API 404; row gone              | ✅                           |
| 2.2 | Cancelling returns to the edit modal intact   | Delete, Cancel                      | Edit modal open with the bug; API unchanged | ✅                           |
| 2.3 | Deleting from the Closed view keeps that view | Close a bug, show Closed, delete it | Bug gone; Closed still selected             | ✅ `delete-bug-plan.spec.ts` |
| 2.4 | Deleted id is not reused                      | Delete, create another              | New id is higher                            | ✅ API (`tests/data/`)       |

## Deleted elsewhere

| #   | Test                                        | Steps                         | Expected                              | Automated                                               |
| --- | ------------------------------------------- | ----------------------------- | ------------------------------------- | ------------------------------------------------------- |
| 3.1 | Clicking the row of a bug deleted elsewhere | Delete via API, click its row | Row removed or "Bug not found." shown | ✅ `delete-bug-plan.spec.ts` (data-06 fixed 2026-09-22) |

## Removed after review

- **Deleting via the API without a session.** This belongs to security, and `tests/api/auth.spec.ts` already pins it.
