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
