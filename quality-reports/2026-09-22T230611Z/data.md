# Data integrity: run 2026-09-22T230611Z

**Verdict:** ready-with-known-risk. **Confidence:** high.

Bugs read back the same way at every layer: POST/PUT response, GET :id, GET list, a read-only SQLite connection, the board cell and the edit modal. Five previous findings are fixed (data-01, 02, 03, 05, 06) and so is the suite residue (data-09). What is still open is low severity: no length limits (data-04), last write wins (data-07, as the spec says), a restart not observed (data-08), a narrower cleanup risk in the suite (data-10), and two new blank-check gaps (data-11, data-12).

## Carried forward

| id | status | one line |
|---|---|---|
| data-01 | fixed | CR/LF runs in a title are stored as one space on create and update. The UI modal and board agree. Owner and description keep their newlines. |
| data-02 | fixed | `Nabc`, `N.9`, `Ne5`, `0N`, `+N`, `0`, `-1` give 400 on GET, PUT and DELETE. |
| data-03 | fixed | Create and update responses are read back from the DB. Lone surrogates show U+FFFD in the response too. |
| data-04 | confirmed (narrowed) | A 90k title is still accepted. The 413 is now JSON, and the UI shows "The request body is too large." and keeps the draft. |
| data-05 | fixed | U+200B-U+200D, U+2060 and U+FEFF alone are 400 in every field. |
| data-06 | fixed | A save, delete or row click after another client's delete refreshes the board and drops the row. |
| data-07 | hardening | 20 parallel PUT rounds: 0 mixed rows. A stale write is silently lost, as spec 09 allows. |
| data-08 | gap | The restart is forbidden. Observed: rows 1-3 survive and sqlite_sequence only rises (3306, 6748, 7063). |
| data-09 | fixed | The zero-width test expects 400. After a round-trip run there were 0 new rows and 0 rows with hex E2808B. |
| data-10 | potential (narrowed) | create, createRaw and expectTitle clean up after a failure. Two UI tests still don't register their title. |

## Side effects of the new rules (asked by the lead)

- **Existing multi-line titles:** the DB has 0 titles with CR or LF, and the read path does no transform, so no stored value changes on read. A description-only edit keeps the title. Leftover risk: a legacy multi-line row edited in the title field would be joined with no space (chromium strips the break first). No such row exists, and I can't create one because the DB is read-only to me.
- **The one-line regex `\s*[\r\n]+\s*`** also absorbs whitespace next to a break (`a<NBSP>\nb` becomes `a b`). This is intended. Inner NBSP and double spaces are kept. U+2028, U+0085, VT and FF are not converted and are stored verbatim. U+2028 renders on one line on the board and in the modal.
- **Invisible-character rule:** it tests only and never strips. ZWJ emoji (a family and a rainbow flag, through the UI), a ZWNJ Persian word, a VS16 heart and a ZWSP-padded owner are stored byte-for-byte.
- **Trimming:** it is visible to the user only as the saved result. A title padded with NBSP or spaces in the UI shows trimmed in the response, DB, board and modal. It is consistent across layers and there is no message.

## New

- **data-11 (low, confirmed):** LRM/RLM, soft hyphen, CGJ, Mongolian vowel separator, invisible operators, bidi controls, Hangul fillers, braille blank, VS16 and tag characters alone all get 201 in every field. A title of just U+200E created through the UI shows as a blank row.
- **data-12 (low, confirmed):** the edit modal's blank check ignores zero-width characters, so Save is enabled for a U+200B title and the server answers 400 "Title is required." The create modal blocks the same value before sending anything.

## Observations for the lead (not my findings)

- Four prefix-less rows appeared during my run: ids 6972, 6973, 7009, 7010, with titles U+00AD+U+200E and U+2800. They are data-11 probes from another agent. I left them alone.
- My own invisible-only title probes also could not carry `[data]`. Each was deleted right after its request, and 0 `[data]` rows remain.

## Evidence

All under `quality-reports/2026-09-22T230611Z/evidence/data/`:

- `api-retest.mjs` / `api-retest.log`: API layers and concurrency.
- `ui-retest.mjs` / `ui-retest.log`, plus `ui-06-stale-save.png`: the UI path.
- `round-trip-run.txt`: the suite run with DB residue before and after.
- `residue/residue.spec.ts`, `residue/run.txt`: the fixture cleanup probe. Leaked rows 7061 and 7062 were then deleted (204).
