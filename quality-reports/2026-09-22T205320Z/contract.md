# API contract — run 2026-09-22T205320Z

**Verdict:** ready-with-known-risk. **Confidence:** high.

The candidate diff doesn't change the contract. It only moves the backend port from 3000 to 3002 and updates the Vite proxy to match. Every endpoint returns its documented status and shape for well-formed input. I found three medium contract breaks, all already present in origin/main: a 500 HTML response from login, HTML error pages for malformed JSON, and lenient id parsing that lets `DELETE /api/bugs/15abc` delete bug 15. I also found two low-severity contract breaks, one low hardening item, one ambiguous business rule and one coverage gap.

## Port-change slice

No spec, README or engineering doc names port 3000. `README.md`, `specs/**` (including `api-conventions.md` and `tech-stack.md`) and `playwright.config.ts` don't give a backend port at all. The only mentions of 3002 are in `backend/src/index.ts:7`, `frontend/vite.config.ts:9`, the untracked `learning.md` and `.claude/agents/*`. The proxy works: all 112 requests were sent through :5173, and I spot-checked some directly on :3002 with identical results. The new `matt` / `<redacted>` user logs in with 200 `{"username":"matt"}`.

## Reconstructed contract (from `backend/src/index.ts`)

All error bodies are `{ "error": <code>, "message": <string> }`. `Bug` = `{ id: int, title, severity: "HIGH"|"MID"|"LOW", owner, description, state: "OPEN"|"CLOSED" }`. None of the endpoints require authentication.

| Method, path | Request | Statuses |
|---|---|---|
| GET /api/health | none | 200 `{ok:true, message:"BuggyBoard API is running", database:"connected"\|"error"}` |
| POST /api/login | `{username, password}` strings; username trimmed | 200 `{username}` · 400 `blank_username` / `blank_password` / `missing_credentials` · 401 `invalid_credentials` |
| GET /api/bugs | none | 200 `Bug[]` ordered by id |
| POST /api/bugs | `{title, severity, owner, description}`; strings trimmed; severity case-insensitive; `id`/`state` ignored | 201 `Bug` (state OPEN) · 400 `blank_title` / `blank_severity` (also used for invalid severity) / `blank_owner` / `blank_description` (checked in that order) |
| GET /api/bugs/:id | integer id | 200 `Bug` · 400 `invalid_id` · 404 `not_found` |
| PUT /api/bugs/:id | full replacement `{title, severity, owner, description, state}`; state case-insensitive and required | 200 `Bug` · 400 `invalid_id` / `blank_*` / `invalid_state` · 404 `not_found` (checked before the body is validated) |
| DELETE /api/bugs/:id | integer id | 204 empty · 400 `invalid_id` · 404 `not_found` |
| *undocumented* | malformed JSON; non-string username; unknown path | 400 HTML; 500 HTML; 404 HTML |

The route code and the feature specs don't conflict on any validated field. Specs 06, 09 and 13 require title, severity, owner and description, a state of Open or Closed, and new bugs created as Open. The API enforces all of these and ignores a client-supplied `state` or `id`. PUT requires every field, including state. Spec 09's edit modal always sends every field, so this is consistent. It's recorded as an observation, not a finding.

## Findings

| id | title | type | severity | status |
|---|---|---|---|---|
| contract-01 | POST /api/login returns 500 HTML with a stack trace for a non-string username | contract break | medium | confirmed |
| contract-02 | Malformed JSON or a `null` body returns Express's HTML 400 with a stack trace | contract break | medium | confirmed |
| contract-03 | id parsing accepts `15abc`, `13.9` and ` 13`, and DELETE/PUT act on the real bug; negative and hex ids return 404, not 400 | contract break | medium | confirmed |
| contract-04 | Unknown /api/* paths and unsupported methods return HTML 404 | contract break | low | confirmed |
| contract-05 | Invalid severity reports `blank_severity`; wrong-type fields report `blank_*` | contract break | low | confirmed |
| contract-06 | A JSON body sent without a JSON Content-Type is read as empty and reported as blank fields | contract break (minor) | low | hardening |
| contract-07 | A whitespace-only password is treated as a real password (401), not as blank | business rule (ambiguous) | low | potential |
| contract-08 | No API contract doc and no API tests | coverage | medium | gap |

Details, repros and the smallest fix for each are in `findings/contract.json`. The frontend reads error bodies with `res.json().catch(() => ({}))`, so today HTML errors show up as generic UI messages rather than crashes. The breaks matter to any other API client and to future tests.

## Evidence

- `evidence/contract/probe.sh`: every request, runnable as `probe.sh [base-url]`
- `evidence/contract/probe-results.tsv`: raw status, content type and body for each request
- `evidence/contract/probe-table.md`: the table below; `table.cjs` renders it
- `evidence/contract/500-login-username-number.html` and `400-malformed-json.html`: full error pages
- `evidence/contract/cleanup.log`: deleted my own bugs 7–13; 0 `[contract]` bugs remain

The shape check on `GET /api/bugs` found 0 violations across 12 items: exactly six keys in order, an integer id, and valid severity and state enums. Bold marks an actual status or content type that differs from the expected value. Rows where the status matched but the error code didn't (C16, P13, C17 and similar) are covered by contract-05.

| case | request | expected | actual | body shape |
|---|---|---|---|---|
| H1-valid | `GET /api/health` | 200 JSON | 200 | {"ok":true} |
| H2-post | `POST /api/health` | 404/405 JSON | **404** | HTML: Cannot POST /api/health |
| U1-unknown | `GET /api/nope` | 404 JSON | **404** | HTML: Cannot GET /api/nope |
| U2-unknown-post | `POST /api/nope` | 404 JSON | **404** | HTML: Cannot POST /api/nope |
| U3-bugs-trailing | `GET /api/bugs/` | 200 JSON | 200 | Bug[] |
| U4-patch | `PATCH /api/bugs/1` | 404/405 JSON | **404** | HTML: Cannot PATCH /api/bugs/1 |
| U5-login-get | `GET /api/login` | 404/405 JSON | **404** | HTML: Cannot GET /api/login |
| L01-valid | `POST /api/login` | 200 {username} | 200 | {"username":"buggy"} |
| L02-valid-2nd | `POST /api/login` | 200 {username} | 200 | {"username":"vanny"} |
| L03-new-user-matt | `POST /api/login` | 200 {username} | 200 | {"username":"matt"} |
| L04-ws-username | `POST /api/login` | 200 trimmed | 200 | {"username":"buggy"} |
| L05-missing-username | `POST /api/login` | 400 blank_username | 400 | {"error":"blank_username"} |
| L06-missing-password | `POST /api/login` | 400 blank_password | 400 | {"error":"blank_password"} |
| L07-empty-body | `POST /api/login` | 400 missing_credentials | 400 | {"error":"missing_credentials"} |
| L08-blank-username | `POST /api/login` | 400 blank_username | 400 | {"error":"blank_username"} |
| L09-ws-only-username | `POST /api/login` | 400 blank_username | 400 | {"error":"blank_username"} |
| L10-blank-password | `POST /api/login` | 400 blank_password | 400 | {"error":"blank_password"} |
| L11-ws-only-password | `POST /api/login` | 400 blank_password (spec ambiguous) | **401** | {"error":"invalid_credentials"} |
| L12-both-blank | `POST /api/login` | 400 missing_credentials | 400 | {"error":"missing_credentials"} |
| L13-wrong-password | `POST /api/login` | 401 invalid_credentials | 401 | {"error":"invalid_credentials"} |
| L14-unknown-user | `POST /api/login` | 401 invalid_credentials | 401 | {"error":"invalid_credentials"} |
| L15-username-number | `POST /api/login` | 400 JSON | **500** | HTML: TypeError: username.trim is not a function |
| L16-username-null | `POST /api/login` | 400 blank_username | 400 | {"error":"blank_username"} |
| L17-username-array | `POST /api/login` | 400 JSON | **500** | HTML: TypeError: username.trim is not a function |
| L18-password-number | `POST /api/login` | 400/401 JSON | 401 | {"error":"invalid_credentials"} |
| L19-password-null | `POST /api/login` | 400 blank_password | 400 | {"error":"blank_password"} |
| L20-password-array | `POST /api/login` | 400/401 JSON | 401 | {"error":"invalid_credentials"} |
| L21-username-object | `POST /api/login` | 400 JSON | **500** | HTML: TypeError: username.trim is not a function |
| L22-malformed-json | `POST /api/login` | 400 JSON | **400** | HTML: SyntaxError: Unexpected end of JSON input |
| L23-no-content-type | `POST /api/login` | 400/415 JSON | 400 | {"error":"missing_credentials"} |
| L24-text-plain | `POST /api/login` | 400/415 JSON | 400 | {"error":"missing_credentials"} |
| L25-body-array | `POST /api/login` | 400 JSON | 400 | {"error":"missing_credentials"} |
| L26-body-null | `POST /api/login` | 400 JSON | **400** | HTML:  |
| L27-case-username | `POST /api/login` | 401 invalid_credentials | 401 | {"error":"invalid_credentials"} |
| G1-list | `GET /api/bugs` | 200 Bug[] | 200 | Bug[] |
| G2-list-query | `GET /api/bugs?state=closed` | 200 Bug[] (query ignored) | 200 | Bug[] |
| C01-valid-lower | `POST /api/bugs` | 201 Bug | 201 | Bug |
| C02-valid-upper | `POST /api/bugs` | 201 Bug | 201 | Bug |
| C03-severity-mixed | `POST /api/bugs` | 201 Bug | 201 | Bug |
| C04-severity-padded | `POST /api/bugs` | 201 Bug | 201 | Bug |
| C05-state-ignored | `POST /api/bugs` | 201 Bug state OPEN | 201 | Bug |
| C06-missing-title | `POST /api/bugs` | 400 blank_title | 400 | {"error":"blank_title"} |
| C07-missing-severity | `POST /api/bugs` | 400 blank_severity | 400 | {"error":"blank_severity"} |
| C08-missing-owner | `POST /api/bugs` | 400 blank_owner | 400 | {"error":"blank_owner"} |
| C09-missing-description | `POST /api/bugs` | 400 blank_description | 400 | {"error":"blank_description"} |
| C10-empty-body | `POST /api/bugs` | 400 blank_title | 400 | {"error":"blank_title"} |
| C11-blank-title | `POST /api/bugs` | 400 blank_title | 400 | {"error":"blank_title"} |
| C12-ws-title | `POST /api/bugs` | 400 blank_title | 400 | {"error":"blank_title"} |
| C13-ws-owner | `POST /api/bugs` | 400 blank_owner | 400 | {"error":"blank_owner"} |
| C14-ws-description | `POST /api/bugs` | 400 blank_description | 400 | {"error":"blank_description"} |
| C15-blank-severity | `POST /api/bugs` | 400 blank_severity | 400 | {"error":"blank_severity"} |
| C16-invalid-severity | `POST /api/bugs` | 400 invalid_severity | 400 | {"error":"blank_severity"} |
| C17-title-number | `POST /api/bugs` | 400 type error | 400 | {"error":"blank_title"} |
| C18-title-null | `POST /api/bugs` | 400 blank_title | 400 | {"error":"blank_title"} |
| C19-title-array | `POST /api/bugs` | 400 type error | 400 | {"error":"blank_title"} |
| C20-severity-number | `POST /api/bugs` | 400 type error | 400 | {"error":"blank_severity"} |
| C21-severity-null | `POST /api/bugs` | 400 blank_severity | 400 | {"error":"blank_severity"} |
| C22-severity-array | `POST /api/bugs` | 400 type error | 400 | {"error":"blank_severity"} |
| C23-owner-number | `POST /api/bugs` | 400 type error | 400 | {"error":"blank_owner"} |
| C24-description-null | `POST /api/bugs` | 400 blank_description | 400 | {"error":"blank_description"} |
| C25-malformed-json | `POST /api/bugs` | 400 JSON | **400** | HTML: SyntaxError: Unexpected end of JSON input |
| C26-no-content-type | `POST /api/bugs` | 400/415 JSON | 400 | {"error":"blank_title"} |
| C27-all-blank | `POST /api/bugs` | 400 blank_title | 400 | {"error":"blank_title"} |
| C28-body-array | `POST /api/bugs` | 400 JSON | 400 | {"error":"blank_title"} |
| C29-owner-nonuser | `POST /api/bugs` | 201 (no rule) | 201 | Bug |
| R01-valid | `GET /api/bugs/13` | 200 Bug | 200 | Bug |
| R02-missing | `GET /api/bugs/999999999` | 404 not_found | 404 | {"error":"not_found"} |
| R03-non-numeric | `GET /api/bugs/abc` | 400 invalid_id | 400 | {"error":"invalid_id"} |
| R04-1abc | `GET /api/bugs/13abc` | 400 invalid_id | **200** | Bug |
| R05-negative | `GET /api/bugs/-1` | 400 invalid_id | **404** | {"error":"not_found"} |
| R06-zero | `GET /api/bugs/0` | 400 invalid_id or 404 | **404** | {"error":"not_found"} |
| R07-decimal | `GET /api/bugs/13.9` | 400 invalid_id | **200** | Bug |
| R08-huge | `GET /api/bugs/99999999999999999999999` | 400 invalid_id or 404 | **404** | {"error":"not_found"} |
| R09-hex | `GET /api/bugs/0x1` | 400 invalid_id | **404** | {"error":"not_found"} |
| R10-leading-ws | `GET /api/bugs/%2013` | 400 invalid_id | **200** | Bug |
| P01-valid | `PUT /api/bugs/13` | 200 Bug | 200 | Bug |
| P02-valid-upper-state | `PUT /api/bugs/13` | 200 Bug | 200 | Bug |
| P03-missing-state | `PUT /api/bugs/13` | 400 blank_state/invalid_state | 400 | {"error":"invalid_state"} |
| P04-invalid-state | `PUT /api/bugs/13` | 400 invalid_state | 400 | {"error":"invalid_state"} |
| P05-blank-state | `PUT /api/bugs/13` | 400 invalid_state | 400 | {"error":"invalid_state"} |
| P06-state-number | `PUT /api/bugs/13` | 400 invalid_state | 400 | {"error":"invalid_state"} |
| P07-partial-title-only | `PUT /api/bugs/13` | 400 (full replace) | 400 | {"error":"blank_severity"} |
| P08-missing-title | `PUT /api/bugs/13` | 400 blank_title | 400 | {"error":"blank_title"} |
| P09-missing-owner | `PUT /api/bugs/13` | 400 blank_owner | 400 | {"error":"blank_owner"} |
| P10-missing-description | `PUT /api/bugs/13` | 400 blank_description | 400 | {"error":"blank_description"} |
| P11-missing-severity | `PUT /api/bugs/13` | 400 blank_severity | 400 | {"error":"blank_severity"} |
| P12-ws-title | `PUT /api/bugs/13` | 400 blank_title | 400 | {"error":"blank_title"} |
| P13-invalid-severity | `PUT /api/bugs/13` | 400 invalid_severity | 400 | {"error":"blank_severity"} |
| P14-title-null | `PUT /api/bugs/13` | 400 blank_title | 400 | {"error":"blank_title"} |
| P15-title-array | `PUT /api/bugs/13` | 400 type error | 400 | {"error":"blank_title"} |
| P16-owner-number | `PUT /api/bugs/13` | 400 type error | 400 | {"error":"blank_owner"} |
| P17-malformed-json | `PUT /api/bugs/13` | 400 JSON | **400** | HTML: SyntaxError: Unexpected end of JSON input |
| P18-no-content-type | `PUT /api/bugs/13` | 400/415 JSON | 400 | {"error":"blank_title"} |
| P19-empty-body | `PUT /api/bugs/13` | 400 blank_title | 400 | {"error":"blank_title"} |
| P20-missing-id-valid-body | `PUT /api/bugs/999999999` | 404 not_found | 404 | {"error":"not_found"} |
| P21-missing-id-invalid-body | `PUT /api/bugs/999999999` | 404 not_found | 404 | {"error":"not_found"} |
| P22-non-numeric-id | `PUT /api/bugs/abc` | 400 invalid_id | 400 | {"error":"invalid_id"} |
| P23-1abc | `PUT /api/bugs/13abc` | 400 invalid_id | **200** | Bug |
| P24-negative-id | `PUT /api/bugs/-1` | 400 invalid_id | **404** | {"error":"not_found"} |
| P25-body-id-ignored | `PUT /api/bugs/13` | 200 path id wins | 200 | Bug |
| P26-state-padded | `PUT /api/bugs/13` | 200 CLOSED | 200 | Bug |
| D01-valid | `DELETE /api/bugs/14` | 204 empty | 204 | (empty) |
| D02-already-deleted | `DELETE /api/bugs/14` | 404 not_found | 404 | {"error":"not_found"} |
| D03-get-after-delete | `GET /api/bugs/14` | 404 not_found | 404 | {"error":"not_found"} |
| D04-missing | `DELETE /api/bugs/999999999` | 404 not_found | 404 | {"error":"not_found"} |
| D05-non-numeric | `DELETE /api/bugs/abc` | 400 invalid_id | 400 | {"error":"invalid_id"} |
| D06-1abc | `DELETE /api/bugs/15abc` | 400 invalid_id | **204** | (empty) |
| D07-1abc-confirm | `GET /api/bugs/15` | 200 (bug still exists) | **404** | {"error":"not_found"} |
| D08-negative | `DELETE /api/bugs/-1` | 400 invalid_id | **404** | {"error":"not_found"} |
| D09-with-body-no-ct | `DELETE /api/bugs/999999999` | 404 not_found | 404 | {"error":"not_found"} |
| D10-malformed-json-body | `DELETE /api/bugs/999999999` | 400 JSON | **400** | HTML:  |
| D11-no-id | `DELETE /api/bugs` | 404/405 JSON | **404** | HTML: Cannot DELETE /api/bugs |

## Not established

- Backward compatibility: there's no versioned contract and no consumer tests.
- I didn't run the baseline. I attributed the findings to origin/main because the route and service code is unchanged in the diff.
- Authentication on the bug routes and the severity of the stack-trace disclosure belong to `security`. Payload-size limits, unicode handling and concurrency weren't probed.
