#!/usr/bin/env bash
# API contract probe. Usage: probe.sh [base]  (default http://localhost:5173)
# Passwords come from the environment: BUGGY_PW and MATT_PW.
B="${1:-http://localhost:5173}"
J='Content-Type: application/json'
OUT="$(dirname "$0")/probe-results.tsv"
: > "$OUT"
printf 'case\tmethod\tpath\tstatus\tcontent-type\tbody\n' >> "$OUT"
p() { # case method path [curl args]
  local c="$1" m="$2" path="$3"; shift 3
  local tmp; tmp=$(mktemp)
  local meta; meta=$(curl -s -o "$tmp" -w '%{http_code}\t%{content_type}' -X "$m" "$B$path" "$@")
  local body; body=$(tr -d '\n\r' < "$tmp" | cut -c1-160)
  rm -f "$tmp"
  printf '%s\t%s\t%s\t%s\t%s\n' "$c" "$m" "$path" "$meta" "$body" >> "$OUT"
}
mk() { curl -s -X POST "$B/api/bugs" -H "$J" -d "{\"title\":\"[contract] $1\",\"severity\":\"high\",\"owner\":\"buggy\",\"description\":\"probe\"}" | sed -E 's/.*"id":([0-9]+).*/\1/'; }

# health
p H1-valid GET /api/health
p H2-post POST /api/health -H "$J" -d '{}'
# unknown api paths
p U1-unknown GET /api/nope
p U2-unknown-post POST /api/nope -H "$J" -d '{}'
p U3-bugs-trailing GET /api/bugs/
p U4-patch PATCH /api/bugs/1 -H "$J" -d '{}'
p U5-login-get GET /api/login

# login
p L01-valid POST /api/login -H "$J" -d '{"username":"buggy","password":"'"$BUGGY_PW"'"}'
p L02-valid-2nd POST /api/login -H "$J" -d '{"username":"vanny","password":"1979bus"}'
p L03-new-user-matt POST /api/login -H "$J" -d '{"username":"matt","password":"'"$MATT_PW"'"}'
p L04-ws-username POST /api/login -H "$J" -d '{"username":"  buggy  ","password":"'"$BUGGY_PW"'"}'
p L05-missing-username POST /api/login -H "$J" -d '{"password":"'"$BUGGY_PW"'"}'
p L06-missing-password POST /api/login -H "$J" -d '{"username":"buggy"}'
p L07-empty-body POST /api/login -H "$J" -d '{}'
p L08-blank-username POST /api/login -H "$J" -d '{"username":"","password":"x"}'
p L09-ws-only-username POST /api/login -H "$J" -d '{"username":"   ","password":"x"}'
p L10-blank-password POST /api/login -H "$J" -d '{"username":"buggy","password":""}'
p L11-ws-only-password POST /api/login -H "$J" -d '{"username":"buggy","password":"   "}'
p L12-both-blank POST /api/login -H "$J" -d '{"username":"","password":""}'
p L13-wrong-password POST /api/login -H "$J" -d '{"username":"buggy","password":"nope"}'
p L14-unknown-user POST /api/login -H "$J" -d '{"username":"ghost","password":"x"}'
p L15-username-number POST /api/login -H "$J" -d '{"username":123,"password":"x"}'
p L16-username-null POST /api/login -H "$J" -d '{"username":null,"password":"x"}'
p L17-username-array POST /api/login -H "$J" -d '{"username":["buggy"],"password":"'"$BUGGY_PW"'"}'
p L18-password-number POST /api/login -H "$J" -d '{"username":"buggy","password":1970}'
p L19-password-null POST /api/login -H "$J" -d '{"username":"buggy","password":null}'
p L20-password-array POST /api/login -H "$J" -d '{"username":"buggy","password":["1970beetle"]}'
p L21-username-object POST /api/login -H "$J" -d '{"username":{},"password":"x"}'
p L22-malformed-json POST /api/login -H "$J" -d '{"username":'
p L23-no-content-type POST /api/login -d '{"username":"buggy","password":"'"$BUGGY_PW"'"}'
p L24-text-plain POST /api/login -H 'Content-Type: text/plain' -d '{"username":"buggy","password":"'"$BUGGY_PW"'"}'
p L25-body-array POST /api/login -H "$J" -d '[]'
p L26-body-null POST /api/login -H "$J" -d 'null'
p L27-case-username POST /api/login -H "$J" -d '{"username":"BUGGY","password":"'"$BUGGY_PW"'"}'

# list
p G1-list GET /api/bugs
p G2-list-query GET '/api/bugs?state=closed'

# create
V='"severity":"high","owner":"buggy","description":"probe"'
p C01-valid-lower POST /api/bugs -H "$J" -d "{\"title\":\"[contract] C01 valid\",$V}"
p C02-valid-upper POST /api/bugs -H "$J" -d '{"title":"[contract] C02 upper","severity":"LOW","owner":"buggy","description":"probe"}'
p C03-severity-mixed POST /api/bugs -H "$J" -d '{"title":"[contract] C03 mixed","severity":"Mid","owner":"buggy","description":"probe"}'
p C04-severity-padded POST /api/bugs -H "$J" -d '{"title":"[contract] C04 padded","severity":" high ","owner":"buggy","description":"probe"}'
p C05-state-ignored POST /api/bugs -H "$J" -d '{"title":"[contract] C05 state","severity":"high","owner":"buggy","description":"probe","state":"CLOSED","id":1}'
p C06-missing-title POST /api/bugs -H "$J" -d "{$V}"
p C07-missing-severity POST /api/bugs -H "$J" -d '{"title":"[contract] x","owner":"buggy","description":"probe"}'
p C08-missing-owner POST /api/bugs -H "$J" -d '{"title":"[contract] x","severity":"high","description":"probe"}'
p C09-missing-description POST /api/bugs -H "$J" -d '{"title":"[contract] x","severity":"high","owner":"buggy"}'
p C10-empty-body POST /api/bugs -H "$J" -d '{}'
p C11-blank-title POST /api/bugs -H "$J" -d "{\"title\":\"\",$V}"
p C12-ws-title POST /api/bugs -H "$J" -d "{\"title\":\"   \",$V}"
p C13-ws-owner POST /api/bugs -H "$J" -d '{"title":"[contract] x","severity":"high","owner":"  ","description":"probe"}'
p C14-ws-description POST /api/bugs -H "$J" -d '{"title":"[contract] x","severity":"high","owner":"buggy","description":"\t\n "}'
p C15-blank-severity POST /api/bugs -H "$J" -d '{"title":"[contract] x","severity":"","owner":"buggy","description":"probe"}'
p C16-invalid-severity POST /api/bugs -H "$J" -d '{"title":"[contract] x","severity":"critical","owner":"buggy","description":"probe"}'
p C17-title-number POST /api/bugs -H "$J" -d "{\"title\":42,$V}"
p C18-title-null POST /api/bugs -H "$J" -d "{\"title\":null,$V}"
p C19-title-array POST /api/bugs -H "$J" -d "{\"title\":[\"[contract] arr\"],$V}"
p C20-severity-number POST /api/bugs -H "$J" -d '{"title":"[contract] x","severity":1,"owner":"buggy","description":"probe"}'
p C21-severity-null POST /api/bugs -H "$J" -d '{"title":"[contract] x","severity":null,"owner":"buggy","description":"probe"}'
p C22-severity-array POST /api/bugs -H "$J" -d '{"title":"[contract] x","severity":["high"],"owner":"buggy","description":"probe"}'
p C23-owner-number POST /api/bugs -H "$J" -d '{"title":"[contract] x","severity":"high","owner":7,"description":"probe"}'
p C24-description-null POST /api/bugs -H "$J" -d '{"title":"[contract] x","severity":"high","owner":"buggy","description":null}'
p C25-malformed-json POST /api/bugs -H "$J" -d '{"title":'
p C26-no-content-type POST /api/bugs -d "{\"title\":\"[contract] C26 noct\",$V}"
p C27-all-blank POST /api/bugs -H "$J" -d '{"title":"","severity":"","owner":"","description":""}'
p C28-body-array POST /api/bugs -H "$J" -d '[]'
p C29-owner-nonuser POST /api/bugs -H "$J" -d '{"title":"[contract] C29 owner not a user","severity":"low","owner":"nobody-at-all","description":"probe"}'

# single-bug ops need a known id
ID=$(mk "target")
MISSING=999999999
echo "target id=$ID" > "$(dirname "$0")/probe-ids.txt"

p R01-valid GET "/api/bugs/$ID"
p R02-missing GET "/api/bugs/$MISSING"
p R03-non-numeric GET /api/bugs/abc
p R04-1abc GET "/api/bugs/${ID}abc"
p R05-negative GET /api/bugs/-1
p R06-zero GET /api/bugs/0
p R07-decimal GET "/api/bugs/${ID}.9"
p R08-huge GET /api/bugs/99999999999999999999999
p R09-hex GET /api/bugs/0x1
p R10-leading-ws GET "/api/bugs/%20$ID"

FULL="\"title\":\"[contract] target edited\",\"severity\":\"mid\",\"owner\":\"vanny\",\"description\":\"edited\""
p P01-valid PUT "/api/bugs/$ID" -H "$J" -d "{$FULL,\"state\":\"closed\"}"
p P02-valid-upper-state PUT "/api/bugs/$ID" -H "$J" -d "{$FULL,\"state\":\"OPEN\"}"
p P03-missing-state PUT "/api/bugs/$ID" -H "$J" -d "{$FULL}"
p P04-invalid-state PUT "/api/bugs/$ID" -H "$J" -d "{$FULL,\"state\":\"resolved\"}"
p P05-blank-state PUT "/api/bugs/$ID" -H "$J" -d "{$FULL,\"state\":\"\"}"
p P06-state-number PUT "/api/bugs/$ID" -H "$J" -d "{$FULL,\"state\":1}"
p P07-partial-title-only PUT "/api/bugs/$ID" -H "$J" -d '{"title":"[contract] partial"}'
p P08-missing-title PUT "/api/bugs/$ID" -H "$J" -d '{"severity":"mid","owner":"vanny","description":"d","state":"open"}'
p P09-missing-owner PUT "/api/bugs/$ID" -H "$J" -d '{"title":"[contract] t","severity":"mid","description":"d","state":"open"}'
p P10-missing-description PUT "/api/bugs/$ID" -H "$J" -d '{"title":"[contract] t","severity":"mid","owner":"vanny","state":"open"}'
p P11-missing-severity PUT "/api/bugs/$ID" -H "$J" -d '{"title":"[contract] t","owner":"vanny","description":"d","state":"open"}'
p P12-ws-title PUT "/api/bugs/$ID" -H "$J" -d '{"title":"  ","severity":"mid","owner":"vanny","description":"d","state":"open"}'
p P13-invalid-severity PUT "/api/bugs/$ID" -H "$J" -d '{"title":"[contract] t","severity":"urgent","owner":"vanny","description":"d","state":"open"}'
p P14-title-null PUT "/api/bugs/$ID" -H "$J" -d '{"title":null,"severity":"mid","owner":"vanny","description":"d","state":"open"}'
p P15-title-array PUT "/api/bugs/$ID" -H "$J" -d '{"title":["a"],"severity":"mid","owner":"vanny","description":"d","state":"open"}'
p P16-owner-number PUT "/api/bugs/$ID" -H "$J" -d '{"title":"[contract] t","severity":"mid","owner":5,"description":"d","state":"open"}'
p P17-malformed-json PUT "/api/bugs/$ID" -H "$J" -d '{"title":'
p P18-no-content-type PUT "/api/bugs/$ID" -d "{$FULL,\"state\":\"open\"}"
p P19-empty-body PUT "/api/bugs/$ID" -H "$J" -d '{}'
p P20-missing-id-valid-body PUT "/api/bugs/$MISSING" -H "$J" -d "{$FULL,\"state\":\"open\"}"
p P21-missing-id-invalid-body PUT "/api/bugs/$MISSING" -H "$J" -d '{}'
p P22-non-numeric-id PUT /api/bugs/abc -H "$J" -d "{$FULL,\"state\":\"open\"}"
p P23-1abc PUT "/api/bugs/${ID}abc" -H "$J" -d "{\"title\":\"[contract] via 1abc\",\"severity\":\"low\",\"owner\":\"buggy\",\"description\":\"d\",\"state\":\"open\"}"
p P24-negative-id PUT /api/bugs/-1 -H "$J" -d "{$FULL,\"state\":\"open\"}"
p P25-body-id-ignored PUT "/api/bugs/$ID" -H "$J" -d "{$FULL,\"state\":\"open\",\"id\":1}"
p P26-state-padded PUT "/api/bugs/$ID" -H "$J" -d "{$FULL,\"state\":\" Closed \"}"

# delete: separate bugs so each valid delete has a fresh target
D1=$(mk "del-valid"); D2=$(mk "del-1abc")
echo "del ids=$D1 $D2" >> "$(dirname "$0")/probe-ids.txt"
p D01-valid DELETE "/api/bugs/$D1"
p D02-already-deleted DELETE "/api/bugs/$D1"
p D03-get-after-delete GET "/api/bugs/$D1"
p D04-missing DELETE "/api/bugs/$MISSING"
p D05-non-numeric DELETE /api/bugs/abc
p D06-1abc DELETE "/api/bugs/${D2}abc"
p D07-1abc-confirm GET "/api/bugs/$D2"
p D08-negative DELETE /api/bugs/-1
p D09-with-body-no-ct DELETE "/api/bugs/$MISSING" -d 'garbage'
p D10-malformed-json-body DELETE "/api/bugs/$MISSING" -H "$J" -d '{bad'
p D11-no-id DELETE /api/bugs
