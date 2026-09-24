# API contract report (contract) — run 2026-09-22T230611Z

**Verdict: ready-with-known-risk. Confidence: high.**

I re-tested all 12 findings from the last run. The three medium contract breaks (contract-01, 02 and 03) are fixed, and so are contract-05 and contract-06. Everything still open is low. Four new low findings: contract-13 to contract-16.

I found no regressions. Every error response from the backend is now JSON `{error, message}` with no stack trace. The frontend reads `message` from any non-OK body, sends `Content-Type: application/json` on POST and PUT, and sends no body on DELETE, so it cannot hit the new 415. The only response that used to succeed and now fails is a leading-zero id (`/api/bugs/01`: 200 before, 400 now). The frontend never sends one.

Evidence is in `evidence/contract/`: `probe.sh` (the exact curl for every row), `probe-proxy.tsv` and `probe-direct.tsv` (161 rows each), `table.md` (the rendered table), `proxy-vs-direct.txt`, `headers.txt`, `rate-limit.txt`, `invisible-titles.txt`, `api-tests.txt` (tests/api: 59/59 passed) and `cleanup.txt`.

## Carry-forward

| id | was | now | evidence |
|---|---|---|---|
| contract-01 | 500 HTML for non-string username | **fixed**: 400 invalid_username / invalid_password | R01a-d, L08, L09 |
| contract-02 | body-parser errors as HTML + stack | **fixed**: 400 invalid_json, 413 payload_too_large, 415 unsupported_media_type, 400 bad_request, all JSON | R02a-i, L17, L21, I09, I36, I38, I53 |
| contract-03 | `<id>abc` acted on the real bug | **fixed**: 400 invalid_id for GET/PUT/DELETE; target unchanged | R03a-j, R03v, I06-I10, I32-I34, I50-I51 |
| contract-04 | HTML 404 for unknown paths / methods | **narrowed, confirmed**: JSON 404/405 now, but bare `GET /api` is still HTML | R04a-i, B34, L19, U01 |
| contract-05 | invalid severity -> blank_severity | **fixed**: invalid_severity vs blank_severity | R05a-e, B23 |
| contract-06 | wrong Content-Type read as blank | **fixed**: 415 | R06a-f, L14, B32 |
| contract-07 | whitespace password -> 401 | **potential** (open decision); zero-width username also 401 | R07, L11 |
| contract-08 | no written contract | **gap**: api-conventions.md unchanged | — |
| contract-09 | unguarded breaks in tests/api | **gap, narrowed**: see test review | — |
| contract-10 | missing/blank state -> invalid_state | **confirmed** (open decision) | R10a-b, I2-state-* |
| contract-11 | proxy vs direct differ | **confirmed, narrowed**: OPTIONS and path case only | headers.txt, proxy-vs-direct.txt |
| contract-12 | no length limit | **hardening**: 10k title -> 201 | R12a |

## New findings

- **contract-13 (low, confirmed, contract break).** `invalid_severity` and `invalid_state` each mean two things: a wrong type (`severity: 3` gives "severity must be text.") and a wrong value (`"critical"` gives "Severity must be high, mid, or low."). B20, B21, I2-severity-num, I2-state-num.
- **contract-14 (low, confirmed, contract break).** The media-type and JSON checks are global and run before routing. So `POST /api/health` with a text body gets 415, and with bad JSON gets 400, instead of 405. `POST /api/nope` with a text body gets 415 instead of 404, and `PUT /api/bugs/abc` with bad JSON gets invalid_json instead of invalid_id. H05, H06, B35, I40. Fix: mount `requireJson` and `express.json()` on the three body routes only.
- **contract-15 (low, confirmed, business rule).** The one-line rule converts `\r\n` but not U+2028. A title made only of U+00AD+U+200E, or only of U+2800, is accepted with 201 and shows as empty on the board. B26-B28, invisible-titles.txt.
- **contract-16 (low, hardening, contract).** A 429 `too_many_attempts` has no `Retry-After` header. rate-limit.txt.

## Reconstructed contract (as implemented; nothing is written down, see contract-08)

Every error body is `{ "error": string, "message": string }`, `application/json; charset=utf-8`. The API is also reachable directly at 127.0.0.1:3002. Global rules:

- A POST or PUT with a body that is not `application/json` gets 415 unsupported_media_type. So does a charset other than UTF-8 or an unknown Content-Encoding.
- Malformed or non-object JSON gets 400 invalid_json. A body over 100 KB gets 413 payload_too_large. Any other unreadable request gets 400 bad_request, and an unexpected failure gets 500 internal_error.
- A wrong method on a known path gets 405 method_not_allowed with an `Allow` header. OPTIONS gets 204 with `Allow` (on the backend; through the proxy, see contract-11).
- An unknown `/api/*` path gets 404 not_found.

| method | path | request | statuses |
|---|---|---|---|
| GET | /api/health | — | 200 `{ok:true, message:"BuggyBoard API is running", database:"connected"\|"error"}` |
| POST | /api/login | `{username:string, password:string}` (username trimmed; null = blank) | 200 `{username}`; 400 missing_credentials, blank_username, blank_password, invalid_username, invalid_password; 401 invalid_credentials; 429 too_many_attempts (20 consecutive failures per trimmed, lower-cased username, 15 min) |
| GET | /api/bugs | — | 200 `Bug[]` ordered by id |
| POST | /api/bugs | `{title, severity: high\|mid\|low (any case, trimmed), owner, description}`; state/id ignored | 201 stored `Bug` (state OPEN); 400 blank_title, blank_severity, invalid_severity, blank_owner, blank_description, invalid_<field> (non-string) |
| GET | /api/bugs/:id | id `^[1-9]\d*$` | 200 `Bug`; 400 invalid_id; 404 not_found |
| PUT | /api/bugs/:id | all of POST's fields + `state: open\|closed` (full replacement) | 200 stored `Bug`; 400 invalid_id, same field codes, invalid_state (also for missing/blank); 404 not_found (checked before the body) |
| DELETE | /api/bugs/:id | — | 204 empty; 400 invalid_id; 404 not_found |

`Bug` = `{id:number, title:string (one line), severity:"HIGH"|"MID"|"LOW", owner:string, description:string, state:"OPEN"|"CLOSED"}`.

Where the specs and the code disagree: 06-create-bug says every field is required. The code agrees, but "blank" misses some invisible characters (contract-15). 03-login specifies trimming only for the username (contract-07).

## Evidence table (key rows; all 161 rows in evidence/contract/table.md; each curl is the matching `p` line in probe.sh)

| row | request | input | expected | actual |
|---|---|---|---|---|
| R01a | POST /api/login | username 123 | 400 JSON | 400 invalid_username |
| R01d | POST /api/login | password 123 | 400 | 400 invalid_password |
| R02a | POST /api/login | `{"title":` | 400 JSON | 400 invalid_json |
| R02e | POST /api/bugs | `"x"` | 400 JSON | 400 invalid_json |
| R02f | POST /api/bugs | 200 KB | 413 JSON | 413 payload_too_large |
| R02g | POST /api/bugs | charset=latin1 | 415 JSON | 415 unsupported_media_type |
| R02i | POST /api/bugs | gzip header, plain body | 400 JSON | 400 bad_request |
| R03a | GET /api/bugs/<id>abc | trailing garbage | 400 invalid_id | 400 invalid_id |
| R03g | PUT /api/bugs/<id>abc | trailing garbage | 400, bug unchanged | 400; R03v unchanged |
| R03f | GET /api/bugs/0 | zero | 400 | 400 invalid_id |
| I05 | GET /api/bugs/999999999 | numeric missing | 404 | 404 not_found |
| I06 | GET /api/bugs/0<id> | leading zero | 400? | 400 invalid_id (was 200) |
| I09 | GET /api/bugs/%E0%A4%A | bad percent-encoding | 400 JSON | 400 bad_request |
| R04a | GET /api/nope | unknown | 404 JSON | 404 not_found |
| U01 | GET /api | bare prefix | 404 JSON | **404 text/html** |
| R04c | PATCH /api/bugs/<id> | method | 405 + Allow | 405, Allow: GET, PUT, DELETE |
| L19 | HEAD /api/login | method | 405 | 405, Allow: POST |
| H03 | OPTIONS /api/health | — | 204 + Allow | 204; Allow only direct (contract-11) |
| H05 | POST /api/health | text/plain body | 405 | **415** |
| H06 | POST /api/health | malformed JSON | 405 | **400 invalid_json** |
| B35 | POST /api/nope | text/plain body | 404 | **415** |
| R05a | POST /api/bugs | severity critical | 400 invalid_severity | 400 invalid_severity |
| R05e | POST /api/bugs | severity "   " | 400 blank_severity | 400 blank_severity |
| B20 | POST /api/bugs | severity 3 | 400 | 400 invalid_severity "severity must be text." |
| B22 | POST /api/bugs | severity "high" | 201 HIGH | 201 HIGH |
| B1-title-zw | POST /api/bugs | title U+200B U+2060 | 400 blank_title | 400 blank_title |
| B25 | POST /api/bugs | title with CRLF | 201 one line | 201 "line1 line2" |
| B26 | POST /api/bugs | title with U+2028 | 201 one line | **201, U+2028 kept** |
| B27 | POST /api/bugs | title U+00AD U+200E only | 400 blank_title | **201** |
| B28 | POST /api/bugs | title U+2800 only | 400 blank_title | **201** |
| R06a | POST /api/login | JSON, no Content-Type | 415 | 415 |
| B32 | POST /api/bugs | chunked, no Content-Type | 415 | 415 |
| B33 | POST /api/bugs | no body | 400 blank_title | 400 blank_title |
| I20 | PUT /api/bugs/<id> | CRLF title, mixed-case values | 200 stored row | 200, equals GET (I20v) |
| I2-state-miss | PUT /api/bugs/<id> | state missing | open decision | 400 invalid_state |
| I41 | PUT /api/bugs/999999999 | `{}` | 404 or 400 | 404 not_found |
| I54 | DELETE /api/bugs/<id> | text/plain body | 204 | 204 |
| L11 | POST /api/login | username U+200B | 400? | 401 invalid_credentials |
| R07 | POST /api/login | password "   " | open decision | 401 invalid_credentials |
| rate | POST /api/login ×21 | throwaway user | 429 | 429 too_many_attempts, no Retry-After |

Proxy vs direct: 155 of 161 rows are identical. The 6 that differ are OPTIONS, which Vite answers itself, and `/API/*` (proxy-vs-direct.txt, headers.txt, contract-11).

## Test-suite review (tests/api, 59/59 pass)

The contract test.fail guards are gone. Only three security guards remain, in auth.spec.ts. Weaknesses, all listed under contract-09:

- id-parsing.spec.ts:19 and :36 assert only the status, not `invalid_id`.
- Nothing sends `PUT /api/bugs/<id>abc`, which is the request that overwrote data last run.
- error-bodies.spec.ts:23 ("never include a stack trace") now gets 400 invalid_username from the route and never reaches the error handler. The handler's 500 path is untested.
- No test checks that the create and PUT responses equal the stored row, that titles are stored on one line, or that zero-width values are blank.
- login.spec.ts adds two failures to buggy's shared rate-limit counter on every run.

## Not tested

The 500 internal_error branch (no input reaches it). Baseline origin/main (last run's evidence stands in). Backward compatibility (no versioned contract). The lockout denial of service (a real user locked out even with the right password) and the unbounded failedLogins map, both from code reading only. They belong to security and are passed to the lead.

## Cleanup

This run created 16 `[contract]` bugs and deleted them. It also deleted 4 bugs it had created itself for the blank-title probes, which could not carry the prefix (6972, 6973, 7009, 7010). I checked each one's title and description before deleting it. One successful buggy login reset that account's failure counter.
