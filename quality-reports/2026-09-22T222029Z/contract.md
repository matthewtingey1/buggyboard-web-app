# API contract — run 2026-09-22T222029Z

**Verdict: ready-with-known-risk. Confidence: high.**

The candidate changes no route, handler or service code. All seven previous findings still reproduce. The API tests now guard most of them with `test.fail`. contract-08 is half-addressed: tests exist, but no written contract does. This run found four new items, all low. None is a regression.

Evidence is in `evidence/contract/`:
- `probe.sh` and `probe-results.tsv`: 65 rows through http://localhost:5173.
- `table.md`: the probe rows as a table.
- `headers.txt`: OPTIONS, CORS and case-sensitivity captures, proxy and direct.
- `api-tests.txt`: the scoped run of `tests/api`, 53/53 passed, 18 of them `test.fail` guards.

The probe reads credentials from `users.json` at runtime and redacts them. All `[contract]` bugs it created (3081, 3084–3087) were deleted.

## Reconstructed contract (from backend/src/index.ts)

| Method | Path | Request | Statuses and bodies |
|---|---|---|---|
| GET | /api/health | — | 200 `{ok:true, message:"BuggyBoard API is running", database:"connected"\|"error"}` |
| POST | /api/login | JSON `{username, password}` | 200 `{username}` · 400 `{error: blank_username\|blank_password\|missing_credentials, message}` · 401 `{error:"invalid_credentials", message}` |
| GET | /api/bugs | — | 200 `Bug[]` where Bug = `{id:number, title, severity:"HIGH"\|"MID"\|"LOW", owner, description, state:"OPEN"\|"CLOSED"}` |
| POST | /api/bugs | JSON `{title, severity: high\|mid\|low (any case, trimmed), owner, description}`; `state` is ignored | 201 `Bug` (state OPEN) · 400 `{error: blank_title\|blank_severity\|blank_owner\|blank_description, message}` |
| GET | /api/bugs/:id | — | 200 `Bug` · 400 `invalid_id` · 404 `not_found` |
| PUT | /api/bugs/:id | JSON full replacement `{title, severity, owner, description, state: open\|closed}`; a body `id` is ignored | 200 `Bug` · 400 `invalid_id` \| `blank_*` \| `invalid_state` · 404 `not_found` |
| DELETE | /api/bugs/:id | — | 204 empty · 400 `invalid_id` · 404 `not_found` |

Every error body is meant to be `{error, message}` JSON. The findings below list where it is not. There is no authentication on the bug routes (owned by security).

## Previous findings, re-tested

| id | Result |
|---|---|
| contract-01 | Still reproduces (R01a–c): 500 HTML stack trace. New detail: a non-string password returns 401, not 400. |
| contract-02 | Still reproduces, and is wider than recorded. Every body-parser error is HTML: malformed JSON on POST, PUT and DELETE; `null` or a JSON string body; 413 at 200 KB; 415 for a latin1 charset or `br` encoding; 400 for a bad gzip body. |
| contract-03 | Still reproduces. **PUT /api/bugs/&lt;id&gt;abc overwrote the real bug** (N02, N02v). `.5` and `e5` do the same. Ids 0, -1 and 0x1 return 404, not 400. |
| contract-04 | Still reproduces. HTML 404 for unknown paths and for every wrong method (M01–M05, E04). |
| contract-05 | Still reproduces. The previous fix was incomplete: the service never returns `BLANK_SEVERITY`, so both the service and the route must change. |
| contract-06 | Still reproduces for no Content-Type, text/plain, vnd.api+json, form and multipart. |
| contract-07 | Behaviour unchanged (401). Stays potential until product decides. |
| contract-08 | Re-stated: tests exist, no written contract. Lowered to low. |

## New findings

- **contract-09 (gap, low).** Reproducible breaks that no test guards: PUT with malformed ids; malformed JSON on PUT and DELETE; 413 and 415; wrong methods; Content-Type handling; password edge cases; id 0.
- **contract-10 (confirmed, low).** `bugs.spec.ts:99` treats `invalid_state` for a missing or blank state as the correct result, while every other field reports `blank_<field>`. Separately, `id-parsing.spec.ts:3` tests three methods in one test.
- **contract-11 (confirmed, low).** The proxy and the backend disagree:
  - Vite answers OPTIONS itself with 204 and advertises PATCH, which the backend does not implement.
  - The backend answers OPTIONS with 200 and a text/html body.
  - `/API/BUGS` returns the SPA HTML through the proxy but JSON from the backend directly.
- **contract-12 (hardening, low).** No length limits on title or description. Only body-parser's 100 KB cap applies, and it answers with HTML.

## Review of tests/api

- The `test.fail` guards match real defects, and each one would show up as an unexpected pass once its defect is fixed. They are known defects, not coverage of fixes.
- Only `bugs.spec.ts:99` treats a questionable behaviour as correct (contract-10).
- The error-body guards check only the content-type, not the error code. The fix is therefore not pinned yet.
- A fix for contract-05 that changes only `index.ts` would break `POST /api/bugs without severity returns 400 blank_severity`. That is a useful catch, but only if the fix changes the service too.

## Not tested

- Baseline run (attribution comes from the diff).
- Concurrency, unicode, conditional GET.
- Backward compatibility (there is no versioned contract).
- Auth and X-Powered-By (owned by security).

## Evidence table

| Row | Method | Path | Input | Expected | Actual | Content-Type | Body shape |
|---|---|---|---|---|---|---|---|
| R01a | POST | `/api/login` | username number | 400 JSON | 500 | text/html | HTML: TypeError: username.trim is not a function |
| R01b | POST | `/api/login` | username array | 400 JSON | 500 | text/html | HTML: TypeError: username.trim is not a function |
| R01c | POST | `/api/login` | username object | 400 JSON | 500 | text/html | HTML: TypeError: username.trim is not a function |
| R01d | POST | `/api/login` | password number | 400 JSON | 401 | application/json | "error":"invalid_credentials" |
| R02a | POST | `/api/login` | malformed JSON | 400 JSON | 400 | text/html | HTML: SyntaxError: Unexpected end of JSON input |
| R02b | POST | `/api/bugs` | malformed JSON | 400 JSON | 400 | text/html | HTML: SyntaxError: Unexpected end of JSON input |
| R02d | POST | `/api/login` | body null | 400 JSON | 400 | text/html | HTML: SyntaxError: Unexpected token &#39;n&#39;, &quot;null&qu |
| R03a | GET | `/api/bugs/<id>abc` | id 1abc | 400 invalid_id | 200 | application/json | JSON object |
| R03b | GET | `/api/bugs/<id>.9` | id decimal | 400 invalid_id | 200 | application/json | JSON object |
| R03c | GET | `/api/bugs/%203081` | id leading space | 400 invalid_id | 200 | application/json | JSON object |
| R03d | GET | `/api/bugs/-1` | negative id | 400 invalid_id | 404 | application/json | "error":"not_found" |
| R03e | GET | `/api/bugs/0x1` | hex id | 400 invalid_id | 404 | application/json | "error":"not_found" |
| R04a | GET | `/api/nope` | unknown path | 404 JSON | 404 | text/html | HTML: Cannot GET /api/nope |
| R04b | POST | `/api/health` | wrong method | 405 JSON | 404 | text/html | HTML: Cannot POST /api/health |
| R05a | POST | `/api/bugs` | severity critical | 400 invalid_severity | 400 | application/json | "error":"blank_severity" |
| R05b | POST | `/api/bugs` | title number | 400 invalid_type | 400 | application/json | "error":"blank_title" |
| R06a | POST | `/api/login` | valid JSON, no Content-Type | 415 | 400 | application/json | "error":"missing_credentials" |
| R06b | POST | `/api/bugs` | valid JSON, text/plain | 415 | 400 | application/json | "error":"blank_title" |
| R07 | POST | `/api/login` | whitespace-only password | 400 blank_password? | 401 | application/json | "error":"invalid_credentials" |
| N01 | PUT | `/api/bugs/abc` | non-numeric id | 400 invalid_id | 400 | application/json | "error":"invalid_id" |
| N02 | PUT | `/api/bugs/<id>abc` | id 1abc | 400 invalid_id | 200 | application/json | JSON object |
| N02v | GET | `/api/bugs/<id>` | verify target after PUT 1abc | title unchanged | 200 | application/json | JSON object |
| N03 | PUT | `/api/bugs/<id>.5` | id decimal | 400 invalid_id | 200 | application/json | JSON object |
| N04 | PUT | `/api/bugs/<id>e5` | id exponent | 400 invalid_id | 200 | application/json | JSON object |
| N05 | PUT | `/api/bugs/-1` | negative id | 400 invalid_id | 404 | application/json | "error":"not_found" |
| N06 | PUT | `/api/bugs/0x1` | hex id | 400 invalid_id | 404 | application/json | "error":"not_found" |
| N07 | PUT | `/api/bugs/999999999` | missing numeric id, invalid body | 404 or 400 | 404 | application/json | "error":"not_found" |
| N08 | PUT | `/api/bugs/<id>` | malformed JSON | 400 JSON | 400 | text/html | HTML: SyntaxError: Unexpected end of JSON input |
| N09 | PUT | `/api/bugs/<id>` | no Content-Type | 415 | 400 | application/json | "error":"blank_title" |
| N10 | DELETE | `/api/bugs/-1` | negative id | 400 invalid_id | 404 | application/json | "error":"not_found" |
| N11 | DELETE | `/api/bugs/abc` | malformed JSON body on DELETE | 400 invalid_id or ignored | 400 | text/html | HTML: SyntaxError: Expected property name or &#39;}&#39; in JS |
| M01 | PATCH | `/api/bugs/<id>` | PATCH | 405 JSON | 404 | text/html | HTML: Cannot PATCH /api/bugs/3084 |
| M02 | DELETE | `/api/bugs` | DELETE collection | 405 JSON | 404 | text/html | HTML: Cannot DELETE /api/bugs |
| M03 | PUT | `/api/bugs` | PUT collection | 405 JSON | 404 | text/html | HTML: Cannot PUT /api/bugs |
| M04 | GET | `/api/login` | GET login | 405 JSON | 404 | text/html | HTML: Cannot GET /api/login |
| M05 | DELETE | `/api/health` | DELETE health | 405 JSON | 404 | text/html | HTML: Cannot DELETE /api/health |
| M06 | HEAD | `/api/health` | HEAD health | 200 no body | 200 | application/json | headers only, no body |
| M07 | HEAD | `/api/bugs` | HEAD bugs | 200 no body | 200 | application/json | headers only, no body |
| M08 | HEAD | `/api/nope` | HEAD unknown | 404 | 404 | text/html | headers only, no body |
| M09 | OPTIONS | `/api/bugs` | OPTIONS no preflight headers | 204 | 204 | - | empty |
| M10 | OPTIONS | `/api/bugs/<id>` | CORS preflight PUT | 204 + ACAO | 204 | - | empty |
| M11 | OPTIONS | `/api/login` | CORS preflight POST | 204 + ACAO | 204 | - | empty |
| C01 | POST | `/api/bugs` | application/json; charset=utf-8 | 201 | 201 | application/json | JSON object |
| C02 | POST | `/api/bugs` | application/vnd.api+json | 415 or 201 | 400 | application/json | "error":"blank_title" |
| C03 | POST | `/api/bugs` | form-urlencoded fields | 415 | 400 | application/json | "error":"blank_title" |
| C04 | POST | `/api/bugs` | multipart form | 415 | 400 | application/json | "error":"blank_title" |
| C05 | POST | `/api/bugs` | application/json; charset=latin1 | 415 JSON | 415 | text/html | HTML: UnsupportedMediaTypeError: unsupported charset &quot;LAT |
| C06 | POST | `/api/login` | Content-Encoding: gzip, body not gzip | 400 JSON | 400 | text/html | HTML: Error: incorrect header check |
| C07 | POST | `/api/login` | Content-Encoding: br (unsupported) | 415 JSON | 415 | text/html | HTML: UnsupportedMediaTypeError: unsupported content encoding  |
| C08 | POST | `/api/bugs` | empty body with application/json | 400 blank_title | 400 | application/json | "error":"blank_title" |
| C09 | POST | `/api/bugs` | body is a JSON array | 400 JSON | 400 | application/json | "error":"blank_title" |
| C10 | POST | `/api/bugs` | body is a JSON string (strict) | 400 JSON | 400 | text/html | HTML: SyntaxError: Unexpected token &#39;&quot;&#39;, &quot;&q |
| C11 | GET | `/api/bugs` | Accept: application/xml | 200 JSON or 406 | 200 | application/json | JSON array |
| L01 | POST | `/api/bugs` | 200 KB body (> 100kb limit) | 413 JSON | 413 | text/html | HTML: PayloadTooLargeError: request entity too large |
| L02 | PUT | `/api/bugs/<id>` | 200 KB body | 413 JSON | 413 | text/html | HTML: PayloadTooLargeError: request entity too large |
| L03 | POST | `/api/bugs` | 90 KB description (under limit) | 201 or 400 too_long | 201 | application/json | JSON object |
| L04 | POST | `/api/bugs` | 10k-char title | 400 too_long? | 201 | application/json | JSON object |
| E01 | GET | `/api/bugs/` | trailing slash | 200 | 200 | application/json | JSON array |
| E02 | GET | `/API/BUGS` | upper-case path | 404? | 200 | text/html | HTML:  |
| E03 | GET | `/api/bugs/<id>/` | id trailing slash | 200 | 200 | application/json | JSON object |
| E04 | GET | `/api/bugs/<id>/extra` | extra segment | 404 JSON | 404 | text/html | HTML: Cannot GET /api/bugs/3084/extra |
| E05 | GET | `/api/bugs/99999999999999999999` | huge id | 404 or 400 | 404 | application/json | "error":"not_found" |
| E06 | GET | `/api/bugs/0` | zero id | 400 invalid_id | 404 | application/json | "error":"not_found" |
