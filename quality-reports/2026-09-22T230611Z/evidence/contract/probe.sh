#!/usr/bin/env bash
# Contract probe for run 2026-09-22T230611Z. Credentials come from users.json at runtime and are never logged.
# Usage: probe.sh <origin> <outfile>   e.g. probe.sh http://localhost:5173 probe-proxy.tsv
set -u
B="${1:-http://localhost:5173}"
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/../../../.." && pwd)"
OUT="$DIR/${2:-probe-results.tsv}"
U=buggy
PW="$(node -e 'console.log(require(process.argv[1]).find(u=>u.username==="buggy").password)' "$ROOT/users.json")"
J='Content-Type: application/json'
printf 'row\tmethod\tpath\tinput\texpected\tstatus\tcontent-type\tallow\tbody\n' > "$OUT"
red() { sed "s/$PW/<redacted>/g"; }
# p ROW METHOD PATH "INPUT" "EXPECTED" [curl args...]
p() {
  local row=$1 m=$2 path=$3 desc=$4 exp=$5; shift 5
  local tmp hdr; tmp=$(mktemp); hdr=$(mktemp)
  local meta
  if [ "$m" = HEAD ]; then
    meta=$(curl -s -I -D "$hdr" -o /dev/null -w '%{http_code}\t%{content_type}' "$@" "$B$path")
  else
    meta=$(curl -s -D "$hdr" -o "$tmp" -w '%{http_code}\t%{content_type}' -X "$m" "$@" "$B$path")
  fi
  local allow; allow=$(grep -i '^allow:' "$hdr" | cut -d' ' -f2- | tr -d '\r')
  local body; body=$(head -c 200 "$tmp" | tr '\n\t' '  ' | red)
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$row" "$m" "$path" "$desc" "$exp" "$meta" "$allow" "$body" | tee -a "$OUT"
  rm -f "$tmp" "$hdr"
}
mk() { curl -s -X POST "$B/api/bugs" -H "$J" -d "{\"title\":\"[contract] $1\",\"severity\":\"low\",\"owner\":\"buggy\",\"description\":\"probe\"}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).id))'; }
V='{"title":"[contract] upd","severity":"mid","owner":"buggy","description":"d","state":"open"}'
ok='"severity":"low","owner":"buggy","description":"d"'
TP="probe-contract-$RANDOM$RANDOM"

# ---------- carry-forward re-tests ----------
p R01a POST /api/login 'username number' '400 invalid_username' -H "$J" -d '{"username":123,"password":"x"}'
p R01b POST /api/login 'username array' '400 invalid_username' -H "$J" -d '{"username":["buggy"],"password":"x"}'
p R01c POST /api/login 'username object' '400 invalid_username' -H "$J" -d '{"username":{},"password":"x"}'
p R01d POST /api/login 'password number' '400 invalid_password' -H "$J" -d "{\"username\":\"$TP\",\"password\":123}"
p R02a POST /api/login 'malformed JSON' '400 invalid_json' -H "$J" -d '{"title":'
p R02b POST /api/bugs 'malformed JSON' '400 invalid_json' -H "$J" -d '{"title":'
p R02d POST /api/login 'body null' '400 invalid_json' -H "$J" -d 'null'
p R02e POST /api/bugs 'body "x" (non-object JSON)' '400 invalid_json' -H "$J" -d '"x"'
p R02f POST /api/bugs '200 KB body' '413 payload_too_large' -H "$J" --data-binary "{\"title\":\"[contract] big\",$ok,\"x\":\"$(head -c 200000 /dev/zero | tr '\0' a)\"}"
p R02g POST /api/bugs 'charset=latin1' '415 unsupported_media_type' -H 'Content-Type: application/json; charset=latin1' -d "{\"title\":\"[contract] l1\",$ok}"
p R02h POST /api/bugs 'Content-Encoding br' '415 unsupported_media_type' -H "$J" -H 'Content-Encoding: br' -d "{\"title\":\"[contract] br\",$ok}"
p R02i POST /api/bugs 'Content-Encoding gzip, plain body' '400 JSON' -H "$J" -H 'Content-Encoding: gzip' -d "{\"title\":\"[contract] gz\",$ok}"
A=$(mk "R03 target $RANDOM"); echo "created $A" >> "$DIR/created-ids.txt"
p R03a GET "/api/bugs/${A}abc" 'id <id>abc' '400 invalid_id'
p R03b GET "/api/bugs/${A}.9" 'id decimal' '400 invalid_id'
p R03c GET "/api/bugs/%20${A}" 'id leading space' '400 invalid_id'
p R03d GET /api/bugs/-1 'negative id' '400 invalid_id'
p R03e GET /api/bugs/0x1 'hex id' '400 invalid_id'
p R03f GET /api/bugs/0 'zero id' '400 invalid_id'
p R03g PUT "/api/bugs/${A}abc" 'PUT <id>abc' '400 invalid_id' -H "$J" -d '{"title":"[contract] via 1abc","severity":"mid","owner":"buggy","description":"d","state":"open"}'
p R03h PUT "/api/bugs/${A}.5" 'PUT <id>.5' '400 invalid_id' -H "$J" -d "$V"
p R03i PUT "/api/bugs/${A}e5" 'PUT <id>e5' '400 invalid_id' -H "$J" -d "$V"
p R03j DELETE "/api/bugs/${A}abc" 'DELETE <id>abc' '400 invalid_id'
p R03v GET "/api/bugs/${A}" 'verify target untouched' '200 title "R03 target", state OPEN'
p R04a GET /api/nope 'unknown path' '404 JSON not_found'
p R04b POST /api/health 'wrong method' '405 Allow: GET'
p R04c PATCH "/api/bugs/${A}" 'PATCH' '405 Allow: GET, PUT, DELETE' -H "$J" -d '{}'
p R04d PUT /api/bugs 'PUT collection' '405 Allow: GET, POST' -H "$J" -d '{}'
p R04e DELETE /api/bugs 'DELETE collection' '405 Allow: GET, POST'
p R04f GET /api/login 'GET login' '405 Allow: POST'
p R04g DELETE /api/health 'DELETE health' '405 Allow: GET'
p R04h GET "/api/bugs/${A}/extra" 'extra segment' '404 JSON'
p R04i HEAD /api/nope 'HEAD unknown' '404 JSON'
p R05a POST /api/bugs 'severity critical' '400 invalid_severity' -H "$J" -d '{"title":"[contract] x","severity":"critical","owner":"buggy","description":"d"}'
p R05b POST /api/bugs 'title number' '400 invalid_title' -H "$J" -d '{"title":42,"severity":"low","owner":"buggy","description":"d"}'
p R05c POST /api/bugs 'severity missing' '400 blank_severity' -H "$J" -d '{"title":"[contract] x","owner":"buggy","description":"d"}'
p R05d POST /api/bugs 'severity blank' '400 blank_severity' -H "$J" -d '{"title":"[contract] x","severity":"","owner":"buggy","description":"d"}'
p R05e POST /api/bugs 'severity whitespace' '400 blank_severity' -H "$J" -d '{"title":"[contract] x","severity":"   ","owner":"buggy","description":"d"}'
p R06a POST /api/login 'valid JSON, no Content-Type' '415' --data-binary "{\"username\":\"$U\",\"password\":\"$PW\"}" -H 'Content-Type:'
p R06b POST /api/bugs 'valid JSON, text/plain' '415' -H 'Content-Type: text/plain' -d "{\"title\":\"[contract] tp\",$ok}"
p R06c PUT "/api/bugs/${A}" 'PUT, no Content-Type' '415' --data-binary "$V" -H 'Content-Type:'
p R06d POST /api/bugs 'form-urlencoded' '415' -d 'title=x'
p R06e POST /api/bugs 'multipart' '415' -F 'title=x'
p R06f POST /api/bugs 'vnd.api+json' '415' -H 'Content-Type: application/vnd.api+json' -d "{\"title\":\"[contract] vnd\",$ok}"
p R07 POST /api/login 'whitespace-only password (throwaway user)' '400 blank_password? (open decision)' -H "$J" -d "{\"username\":\"$TP\",\"password\":\"   \"}"
p R10a PUT "/api/bugs/${A}" 'state missing' 'invalid_state (open decision)' -H "$J" -d '{"title":"[contract] s","severity":"mid","owner":"buggy","description":"d"}'
p R10b PUT "/api/bugs/${A}" 'state blank' 'invalid_state (open decision)' -H "$J" -d '{"title":"[contract] s","severity":"mid","owner":"buggy","description":"d","state":""}'
p R12a POST /api/bugs '10,000-char title' '201 (no limit specified)' -H "$J" -d "{\"title\":\"[contract] $(head -c 10000 /dev/zero | tr '\0' t)\",$ok}"

# ---------- health ----------
p H01 GET /api/health 'valid' '200 {ok,message,database}'
p H02 HEAD /api/health 'HEAD' '200 no body'
p H03 OPTIONS /api/health 'OPTIONS' '204 Allow: GET, OPTIONS'
p H04 GET '/api/health?x=1' 'query string' '200'
p H05 POST /api/health 'POST text/plain body' '405 (method before media type)' -H 'Content-Type: text/plain' -d 'x'
p H06 POST /api/health 'POST malformed JSON' '405 (method before body)' -H "$J" -d '{bad'

# ---------- login ----------
p L01 POST /api/login 'valid' '200 {username}' -H "$J" -d "{\"username\":\"$U\",\"password\":\"$PW\"}"
p L02 POST /api/login 'username padded' '200 {username:"buggy"}' -H "$J" -d "{\"username\":\"  $U \",\"password\":\"$PW\"}"
p L03 POST /api/login 'missing username' '400 blank_username' -H "$J" -d '{"password":"x"}'
p L04 POST /api/login 'missing password (throwaway)' '400 blank_password' -H "$J" -d "{\"username\":\"$TP\"}"
p L05 POST /api/login 'empty object' '400 missing_credentials' -H "$J" -d '{}'
p L06 POST /api/login 'username null' '400 blank_username' -H "$J" -d '{"username":null,"password":"x"}'
p L07 POST /api/login 'password null (throwaway)' '400 blank_password' -H "$J" -d "{\"username\":\"$TP\",\"password\":null}"
p L08 POST /api/login 'password array (throwaway)' '400 invalid_password' -H "$J" -d "{\"username\":\"$TP\",\"password\":[\"x\"]}"
p L09 POST /api/login 'username boolean' '400 invalid_username' -H "$J" -d '{"username":true,"password":"x"}'
p L10 POST /api/login 'whitespace username' '400 blank_username' -H "$J" -d '{"username":"   ","password":"x"}'
p L11 POST /api/login 'zero-width-only username' '400 blank_username' -H "$J" -d '{"username":"\u200b","password":"x"}'
p L12 POST /api/login 'body is array' '400 missing_credentials' -H "$J" -d '[]'
p L13 POST /api/login 'unknown user' '401 invalid_credentials' -H "$J" -d "{\"username\":\"$TP-x\",\"password\":\"x\"}"
p L14 POST /api/login 'text/plain' '415' -H 'Content-Type: text/plain' -d 'x'
p L15 POST /api/login 'charset=utf-8' '200' -H 'Content-Type: application/json; charset=utf-8' -d "{\"username\":\"$U\",\"password\":\"$PW\"}"
p L16 POST /api/login 'upper-case media type' '200' -H 'Content-Type: APPLICATION/JSON' -d "{\"username\":\"$U\",\"password\":\"$PW\"}"
p L17 POST /api/login '150 KB body' '413 JSON' -H "$J" --data-binary "{\"username\":\"$TP\",\"password\":\"$(head -c 150000 /dev/zero | tr '\0' a)\"}"
p L18 OPTIONS /api/login 'OPTIONS' '204 Allow: POST, OPTIONS'
p L19 HEAD /api/login 'HEAD' '405'
p L20 POST /api/login 'no body at all' '400 missing_credentials'
p L21 POST /api/login 'trailing garbage after JSON' '400 invalid_json' -H "$J" -d '{"username":"a"}x'

# ---------- GET/POST /api/bugs ----------
p B01 GET /api/bugs 'valid' '200 array'
p B02 HEAD /api/bugs 'HEAD' '200 no body'
p B03 OPTIONS /api/bugs 'OPTIONS' '204 Allow: GET, POST, OPTIONS'
p B04 GET /api/bugs/ 'trailing slash' '200 array'
for f in title owner description; do
  p "B1-$f-num" POST /api/bugs "$f number" "400 invalid_$f" -H "$J" -d "{\"title\":\"[contract] t\",$ok,\"$f\":1}"
  p "B1-$f-null" POST /api/bugs "$f null" "400 blank_$f" -H "$J" -d "{\"title\":\"[contract] t\",$ok,\"$f\":null}"
  p "B1-$f-arr" POST /api/bugs "$f array" "400 invalid_$f" -H "$J" -d "{\"title\":\"[contract] t\",$ok,\"$f\":[\"x\"]}"
  p "B1-$f-zw" POST /api/bugs "$f zero-width only" "400 blank_$f" -H "$J" -d "{\"title\":\"[contract] t\",$ok,\"$f\":\"\\u200b\\u2060\"}"
done
p B20 POST /api/bugs 'severity number' '400 invalid_severity (type)' -H "$J" -d '{"title":"[contract] t","severity":3,"owner":"buggy","description":"d"}'
p B21 POST /api/bugs 'severity array' '400 invalid_severity (type)' -H "$J" -d '{"title":"[contract] t","severity":["low"],"owner":"buggy","description":"d"}'
p B22 POST /api/bugs 'severity lowercase "high"' '201 severity HIGH' -H "$J" -d '{"title":"[contract] lc","severity":"high","owner":"buggy","description":"d"}'
p B23 POST /api/bugs 'severity "Medium"' '400 invalid_severity' -H "$J" -d '{"title":"[contract] t","severity":"Medium","owner":"buggy","description":"d"}'
p B24 POST /api/bugs 'body array' '400 blank_title' -H "$J" -d '[]'
p B25 POST /api/bugs 'title with CRLF' '201 title on one line' -H "$J" -d "{\"title\":\"[contract] line1\\r\\n  line2\",$ok}"
p B26 POST /api/bugs 'title with U+2028' '201 title on one line?' -H "$J" -d "{\"title\":\"[contract] ls1\\u2028ls2\",$ok}"
p B27 POST /api/bugs 'title only soft hyphen / LRM' '400 blank_title?' -H "$J" -d "{\"title\":\"\\u00ad\\u200e\",$ok}"
p B28 POST /api/bugs 'title only braille blank U+2800' '400 blank_title?' -H "$J" -d "{\"title\":\"\\u2800\",$ok}"
p B29 POST /api/bugs 'emoji + lone surrogate title' '201' -H "$J" -d "{\"title\":\"[contract] \\ud83d\\udc1b \\ud800\",$ok}"
p B30 POST /api/bugs 'Content-Type with charset=utf-8' '201' -H 'Content-Type: application/json; charset=utf-8' -d "{\"title\":\"[contract] utf8 é\",$ok}"
p B31 POST /api/bugs 'real gzip body' '201' -H "$J" -H 'Content-Encoding: gzip' --data-binary @<(printf '{"title":"[contract] gz real","severity":"low","owner":"buggy","description":"d"}' | gzip -c)
p B32 POST /api/bugs 'chunked, no Content-Type' '415' -H 'Content-Type:' -H 'Transfer-Encoding: chunked' --data-binary "{\"title\":\"[contract] ch\",$ok}"
p B33 POST /api/bugs 'no body, no Content-Type' '400 blank_title'
p B34 POST /api/bugs/1 'POST to item' '405 Allow: GET, PUT, DELETE' -H "$J" -d '{}'
p B35 POST /api/nope 'POST unknown path, text/plain body' '404 (route before media type)' -H 'Content-Type: text/plain' -d 'x'

# ---------- GET/PUT/DELETE /api/bugs/:id ----------
P=$(mk "item target $RANDOM"); echo "created $P" >> "$DIR/created-ids.txt"
p I01 GET "/api/bugs/$P" 'valid' '200 bug'
p I02 HEAD "/api/bugs/$P" 'HEAD' '200'
p I03 OPTIONS "/api/bugs/$P" 'OPTIONS' '204 Allow: GET, PUT, DELETE, OPTIONS'
p I04 GET /api/bugs/abc 'non-numeric' '400 invalid_id'
p I05 GET /api/bugs/999999999 'numeric missing' '404 not_found'
p I06 GET "/api/bugs/0$P" 'leading zero' '400 invalid_id (or 200?)'
p I07 GET "/api/bugs/${P}%20" 'trailing space' '400 invalid_id'
p I08 GET /api/bugs/99999999999999999999999 'huge id' '404 not_found'
p I09 GET /api/bugs/%E0%A4%A 'malformed percent-encoding' '400 JSON'
p I10 GET "/api/bugs/%d9%a1" 'Arabic-Indic digit' '400 invalid_id'
p I11 HEAD /api/bugs/abc 'HEAD bad id' '400'
p I20 PUT "/api/bugs/$P" 'valid, title CRLF' '200 stored row, one-line title' -H "$J" -d '{"title":"[contract] put\nline2","severity":"HIGH","owner":"vanny","description":"multi\nline","state":"Closed"}'
p I20v GET "/api/bugs/$P" 'verify PUT stored' 'matches I20 body'
for f in title severity owner description state; do
  p "I2-$f-miss" PUT "/api/bugs/$P" "$f missing" "400" -H "$J" -d "$(node -e 'const o=JSON.parse(process.argv[1]);delete o[process.argv[2]];console.log(JSON.stringify(o))' "$V" $f)"
  p "I2-$f-num" PUT "/api/bugs/$P" "$f number" "400 invalid_$f" -H "$J" -d "$(node -e 'const o=JSON.parse(process.argv[1]);o[process.argv[2]]=7;console.log(JSON.stringify(o))' "$V" $f)"
  p "I2-$f-ws" PUT "/api/bugs/$P" "$f whitespace" "400" -H "$J" -d "$(node -e 'const o=JSON.parse(process.argv[1]);o[process.argv[2]]="  ";console.log(JSON.stringify(o))' "$V" $f)"
done
p I30 PUT "/api/bugs/$P" 'severity "critical"' '400 invalid_severity' -H "$J" -d '{"title":"[contract] t","severity":"critical","owner":"buggy","description":"d","state":"open"}'
p I31 PUT "/api/bugs/$P" 'state "pending"' '400 invalid_state' -H "$J" -d '{"title":"[contract] t","severity":"low","owner":"buggy","description":"d","state":"pending"}'
p I32 PUT /api/bugs/abc 'non-numeric' '400 invalid_id' -H "$J" -d "$V"
p I33 PUT /api/bugs/-1 'negative' '400 invalid_id' -H "$J" -d "$V"
p I34 PUT /api/bugs/0 'zero' '400 invalid_id' -H "$J" -d "$V"
p I35 PUT /api/bugs/999999999 'numeric missing' '404 not_found' -H "$J" -d "$V"
p I36 PUT "/api/bugs/$P" 'malformed JSON' '400 invalid_json' -H "$J" -d '{bad'
p I37 PUT "/api/bugs/$P" 'text/plain' '415' -H 'Content-Type: text/plain' -d "$V"
p I38 PUT "/api/bugs/$P" '150 KB' '413 payload_too_large' -H "$J" --data-binary "{\"title\":\"[contract] t\",$ok,\"state\":\"open\",\"x\":\"$(head -c 150000 /dev/zero | tr '\0' a)\"}"
p I39 PUT "/api/bugs/$P" 'no body' '400 blank_title'
p I40 PUT /api/bugs/abc 'bad id + malformed JSON' '400 (either code)' -H "$J" -d '{bad'
p I41 PUT /api/bugs/999999999 'missing id + invalid body' '404 or 400' -H "$J" -d '{}'
p I42 GET "/api/bugs/$P" 'verify after failed PUTs' 'unchanged from I20v'
p I50 DELETE /api/bugs/abc 'non-numeric' '400 invalid_id'
p I51 DELETE /api/bugs/-1 'negative' '400 invalid_id'
p I52 DELETE /api/bugs/999999999 'numeric missing' '404 not_found'
p I53 DELETE /api/bugs/abc 'malformed JSON body' '400 (either code)' -H "$J" -d '{bad'
p I54 DELETE "/api/bugs/$P" 'with text/plain body' '204 (body ignored)' -H 'Content-Type: text/plain' -d 'x'
p I55 DELETE "/api/bugs/$P" 'again' '404 not_found'

# ---------- unknown / routing ----------
p U01 GET /api 'bare /api' '404 JSON'
p U02 GET /api/ '/api/' '404 JSON'
p U03 GET /API/BUGS 'upper-case path' 'same on proxy and direct'
p U04 GET /api/bugs//1 'double slash' '404 JSON'
p U05 OPTIONS /api/nope 'OPTIONS unknown' '404 JSON'
p U06 GET '/api/%E0' 'malformed URI unknown path' '400 or 404 JSON'
p U07 DELETE /api/nope 'DELETE unknown' '404 JSON'
