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
