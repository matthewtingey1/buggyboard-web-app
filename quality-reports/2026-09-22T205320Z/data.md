# Data integrity: run 2026-09-22T205320Z

**Verdict:** ready-with-known-risk. **Confidence:** high (restart persistence not tested).

The diff doesn't touch the data layer (bugService, db and the schema are unchanged). The only relevant change is the backend port moving to 3002.

## Round-trip (API: POST response, GET :id, GET list, read-only DB)

I sent 20 input classes through each of title, owner and description. That gave 60 cases: 57 match at all four layers, and 3 differ (lone surrogate, data-03).

| Input class | title | owner | description |
|---|---|---|---|
| Latin-1, CJK, emoji (ZWJ, skin tone, flag), Arabic, Hebrew+LTR, U+202E bidi override | match | match | match |
| LF, CRLF, inner tab | match (stored in title too, see data-01) | match | match |
| Leading/trailing spaces, NBSP, newlines | trimmed at every layer | trimmed | trimmed |
| Zero-width only (U+200B) | accepted (data-05) | accepted | accepted |
| Quotes/backtick/backslash, HTML, SQL-like, NUL | match | match | match |
| Lone surrogate U+D800 | response echoes it, stored as U+FFFD (data-03) | same | same |
| 10k, 90k chars | match | match | match |
| 120k chars (body > 100kb) | - | - | 413 HTML (data-04) |

Severity: `HIGH`, `mid` and ` Low ` normalise to uppercase. `CRITICAL`, `""` and `m i d` get 400. State on create is always `OPEN`, and a client-sent `state: closed` or `id: 1` is ignored. PUT state `closed`, `OPEN` and ` Closed ` are accepted; `done` and `""` get 400 and the row is unchanged.

## UI round-trip (evidence/data/ui-roundtrip.log)

I created a bug in the New Bug modal. The title had surrounding spaces, emoji, Arabic, quotes, HTML and CJK. The description had several lines, Hebrew, indentation, a tab and trailing blank lines. The request body, the 201 response, GET, the DB, the board row (title, `HIGH`, `buggy`) and the edit modal (all five fields) all match the trimmed input. Inner whitespace is kept. The trim is consistent: a change that only adds trailing spaces leaves Save disabled, and after saving the value reads back trimmed.

A title stored with a newline breaks this (data-01). The board shows `line1 line2`, and the modal input shows `line1line2`. If the user touches the title and saves, the fused text is written to the DB.

## Lifecycle

- A bug created in the UI is `OPEN`. After I set it to Closed in the edit modal, it disappeared from Open and appeared under Closed, and the other fields were unchanged.
- DELETE returns 204, after which GET returns 404, the DB has no row, and a second DELETE returns 404. The next create got id 83 after 82 was deleted, so ids are not reused (`sqlite_sequence` shows AUTOINCREMENT working).
- Path ids are parsed loosely (data-02): `/api/bugs/86abc` and `/86.5` edited and deleted bug 86.

## Concurrency

- Two parallel PUTs both returned 200, and the DB holds the second writer's whole row with no fields mixed. Last write wins as spec 09 says, and a stale client silently overwrote another client's change (data-07, hardening).
- A PUT to a bug another client deleted returns 404 and does not bring the row back, either via the API or in the UI modal. The UI shows "Bug not found." but leaves the deleted row on the board (data-06).
- The board is stale after another client edits a bug, but opening the row fetches fresh data.

## Persistence

I read the DB read-only: `journal_mode=delete`, `synchronous=2`, and each statement autocommits. Every API write showed up immediately in a separate read-only connection. I did not test a restart (data-08, gap).

## Findings

| id | title | severity | status |
|---|---|---|---|
| data-01 | Edit modal strips newlines from a stored title; a title edit persists the joined text | medium | confirmed |
| data-02 | Path ids with trailing junk resolve to the numeric prefix on GET/PUT/DELETE | medium | confirmed |
| data-03 | Create/update responses echo input, not the stored row; lone surrogates become U+FFFD | low | confirmed |
| data-04 | No field length limits; oversize body gives HTML 413 and a generic UI error | low | confirmed |
| data-05 | Zero-width-only values pass the required-field check | low | confirmed |
| data-06 | Board keeps a deleted row after a 404 on save | low | confirmed |
| data-07 | Last write wins with silent lost update (per spec) | low | hardening |
| data-08 | Persistence across restart not demonstrated | low | gap |

Evidence: `evidence/data/api-roundtrip.mjs|.log`, `evidence/data/ui-roundtrip.mjs|.log`, `evidence/data/ui-01-edit-modal-unicode.png`, `ui-05-oversize.png`, `ui-06-stale-edit.png`. All `[data]` bugs were cleaned up (0 left).
