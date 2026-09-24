# Data integrity: run 2026-09-22T222029Z

**Verdict:** ready-with-known-risk. **Confidence:** high.

Nothing in the data layer changed since the last run (the backend diff against cce584c is only the port). All eight previous findings still behave the same way. This run adds two findings about the test suite: it leaves data behind in the shared database.

## Previous findings, re-tested

| id | result |
|---|---|
| data-01 | Still reproduces. Title `a\nb` shows as `ab` in the edit modal. Typing a character and deleting it again saves `ab`. |
| data-02 | Still reproduces. `/bugs/Nabc` and `/bugs/N.5` read, change and delete bug N. |
| data-03 | Still reproduces on both create and update. The response echoes the lone surrogate, but GET and the DB hold U+FFFD. The UI can't send a lone surrogate at all. |
| data-04 | Still reproduces at the API: a 90k title is stored, and a 120k description gets an HTML 413. The UI message was not driven again. |
| data-05 | Still reproduces, and it is wider than reported: U+2060 also passes, in all three fields. |
| data-06 | Still reproduces. The board keeps showing the row after the PUT returns 404. |
| data-07 | Unchanged (hardening). In 20 parallel rounds there were 0 rows mixing both writes, and the stale overwrite still loses the other write. |
| data-08 | Still a gap. The backend could not be restarted this run. |

## New input classes (create and update × title/owner/description; response / GET / list / DB)

These values are preserved exactly at every layer: NUL, inner NBSP, U+202E, U+2067/2069, U+2028, CR-only, BEL/ESC, NFD and NFC (neither is normalised), and astral characters with ZWJ. Leading and trailing NBSP, BOM and U+3000 are trimmed the same way everywhere. The frontend trims before it sends, so the user never sees a value that differs from the stored one. The only differences found are the ones in data-03 and data-05. In the UI (chromium), values with NBSP, bidi characters and NUL match across the request, the DB, the board textContent and the edit modal. Lifecycle works: a new bug is OPEN, and after an edit to Closed it appears under Closed only.

## Suite hygiene

- **data-09 (confirmed, medium).** The `test.fail` zero-width-title test creates a bug titled `​`, which has no prefix, so `cleanup()` won't delete it. There were 5 such rows before my run, and my single scoped run added a 6th (id 3287). I left them in place because they don't carry my prefix. The lead needs to remove them.
- **data-10 (potential, low).** The fixture teardown does run after an assertion failure and after a timeout; a probe spec proved it. But a bug created before `track()` leaks. This affects the UI-create tests and the negative POST tests if they ever regress. The lead's run left 0 `[e2e]` rows.

## Evidence

- `evidence/data/api-retest.mjs` and `api-retest.log`
- `evidence/data/ui-retest.mjs` and `ui-retest.log`, plus the screenshots
- `evidence/data/round-trip-run.txt`
- `evidence/data/residue/` (the probe spec, its config and `run.txt`)

The `[data]` rows remaining at the end of the run: 0.
