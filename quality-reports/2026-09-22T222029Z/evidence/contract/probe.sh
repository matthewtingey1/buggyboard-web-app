#!/usr/bin/env bash
# Contract probe. Credentials are read from users.json at runtime and never logged.
# Usage: probe.sh [origin]   (default http://localhost:5173)
set -u
B="${1:-http://localhost:5173}"
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/../../../.." && pwd)"
OUT="$DIR/probe-results.tsv"
PW="$(node -e 'console.log(require(process.argv[1])[0].password)' "$ROOT/users.json")"
U="$(node -e 'console.log(require(process.argv[1])[0].username)' "$ROOT/users.json")"
J='Content-Type: application/json'
printf 'row\tmethod\tpath\tinput\texpected\tactual\tcontent-type\tbody\n' > "$OUT"
red() { sed "s/$PW/<redacted>/g"; }
# p ROW METHOD PATH "INPUT DESC" EXPECTED [curl args...]
p() {
  local row=$1 m=$2 path=$3 desc=$4 exp=$5; shift 5
  local tmp; tmp=$(mktemp)
  local meta
  if [ "$m" = HEAD ]; then
    meta=$(curl -s -I -o "$tmp" -w '%{http_code}\t%{content_type}' "$@" "$B$path")
  else
    meta=$(curl -s -o "$tmp" -w '%{http_code}\t%{content_type}' -X "$m" "$@" "$B$path")
  fi
  local body; body=$(head -c 160 "$tmp" | tr '\n\t' '  ' | red)
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$row" "$m" "$path" "$desc" "$exp" "$meta" "$body" | tee -a "$OUT"
  rm -f "$tmp"
}
mk() { curl -s -X POST "$B/api/bugs" -H "$J" -d "{\"title\":\"[contract] $1\",\"severity\":\"low\",\"owner\":\"buggy\",\"description\":\"probe\"}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).id))'; }
V='{"title":"[contract] upd","severity":"mid","owner":"buggy","description":"d","state":"open"}'

# --- re-test previous findings ---
p R01a POST /api/login 'username number' '400 JSON' -H "$J" -d '{"username":123,"password":"x"}'
p R01b POST /api/login 'username array' '400 JSON' -H "$J" -d '{"username":["buggy"],"password":"x"}'
p R01c POST /api/login 'username object' '400 JSON' -H "$J" -d '{"username":{},"password":"x"}'
p R01d POST /api/login 'password number' '400 JSON' -H "$J" -d "{\"username\":\"$U\",\"password\":123}"
p R02a POST /api/login 'malformed JSON' '400 JSON' -H "$J" -d '{"title":'
p R02b POST /api/bugs 'malformed JSON' '400 JSON' -H "$J" -d '{"title":'
p R02d POST /api/login 'body null' '400 JSON' -H "$J" -d 'null'
A=$(mk "R03 target $RANDOM")
p R03a GET "/api/bugs/${A}abc" 'id 1abc' '400 invalid_id'
p R03b GET "/api/bugs/${A}.9" 'id decimal' '400 invalid_id'
p R03c GET "/api/bugs/%20${A}" 'id leading space' '400 invalid_id'
p R03d GET /api/bugs/-1 'negative id' '400 invalid_id'
p R03e GET /api/bugs/0x1 'hex id' '400 invalid_id'
p R04a GET /api/nope 'unknown path' '404 JSON'
p R04b POST /api/health 'wrong method' '405 JSON'
p R05a POST /api/bugs 'severity critical' '400 invalid_severity' -H "$J" -d '{"title":"[contract] x","severity":"critical","owner":"buggy","description":"d"}'
p R05b POST /api/bugs 'title number' '400 invalid_type' -H "$J" -d '{"title":42,"severity":"low","owner":"buggy","description":"d"}'
p R06a POST /api/login 'valid JSON, no Content-Type' '415' --data-binary "{\"username\":\"$U\",\"password\":\"$PW\"}" -H 'Content-Type:'
p R06b POST /api/bugs 'valid JSON, text/plain' '415' -H 'Content-Type: text/plain' -d '{"title":"[contract] tp","severity":"low","owner":"buggy","description":"d"}'
p R07 POST /api/login 'whitespace-only password' '400 blank_password?' -H "$J" -d "{\"username\":\"$U\",\"password\":\"   \"}"

# --- PUT with malformed ids (nothing guards these) ---
P=$(mk "put target $RANDOM")
p N01 PUT /api/bugs/abc 'non-numeric id' '400 invalid_id' -H "$J" -d "$V"
p N02 PUT "/api/bugs/${P}abc" 'id 1abc' '400 invalid_id' -H "$J" -d '{"title":"[contract] via 1abc","severity":"mid","owner":"buggy","description":"d","state":"open"}'
p N02v GET "/api/bugs/${P}" 'verify target after PUT 1abc' 'title unchanged'
p N03 PUT "/api/bugs/${P}.5" 'id decimal' '400 invalid_id' -H "$J" -d "$V"
p N04 PUT "/api/bugs/${P}e5" 'id exponent' '400 invalid_id' -H "$J" -d "$V"
p N05 PUT /api/bugs/-1 'negative id' '400 invalid_id' -H "$J" -d "$V"
p N06 PUT /api/bugs/0x1 'hex id' '400 invalid_id' -H "$J" -d "$V"
p N07 PUT /api/bugs/999999999 'missing numeric id, invalid body' '404 or 400' -H "$J" -d '{}'
p N08 PUT "/api/bugs/${P}" 'malformed JSON' '400 JSON' -H "$J" -d '{"title":'
p N09 PUT "/api/bugs/${P}" 'no Content-Type' '415' --data-binary "$V" -H 'Content-Type:'
p N10 DELETE /api/bugs/-1 'negative id' '400 invalid_id'
p N11 DELETE /api/bugs/abc 'malformed JSON body on DELETE' '400 invalid_id or ignored' -H "$J" -d '{bad'

# --- unsupported methods / HEAD / OPTIONS ---
p M01 PATCH "/api/bugs/${P}" 'PATCH' '405 JSON' -H "$J" -d "$V"
p M02 DELETE /api/bugs 'DELETE collection' '405 JSON'
p M03 PUT /api/bugs 'PUT collection' '405 JSON' -H "$J" -d "$V"
p M04 GET /api/login 'GET login' '405 JSON'
p M05 DELETE /api/health 'DELETE health' '405 JSON'
p M06 HEAD /api/health 'HEAD health' '200 no body'
p M07 HEAD /api/bugs 'HEAD bugs' '200 no body'
p M08 HEAD /api/nope 'HEAD unknown' '404'
p M09 OPTIONS /api/bugs 'OPTIONS no preflight headers' '204'
p M10 OPTIONS "/api/bugs/${P}" 'CORS preflight PUT' '204 + ACAO' -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: PUT'
p M11 OPTIONS /api/login 'CORS preflight POST' '204 + ACAO' -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type'

# --- content types ---
p C01 POST /api/bugs 'application/json; charset=utf-8' '201' -H 'Content-Type: application/json; charset=utf-8' -d '{"title":"[contract] ct1","severity":"low","owner":"buggy","description":"d"}'
p C02 POST /api/bugs 'application/vnd.api+json' '415 or 201' -H 'Content-Type: application/vnd.api+json' -d '{"title":"[contract] ct2","severity":"low","owner":"buggy","description":"d"}'
p C03 POST /api/bugs 'form-urlencoded fields' '415' -d 'title=[contract] form&severity=low&owner=buggy&description=d'
p C04 POST /api/bugs 'multipart form' '415' -F 'title=[contract] mp' -F severity=low -F owner=buggy -F description=d
p C05 POST /api/bugs 'application/json; charset=latin1' '415 JSON' -H 'Content-Type: application/json; charset=latin1' -d '{"title":"[contract] ct5","severity":"low","owner":"buggy","description":"d"}'
p C06 POST /api/login 'Content-Encoding: gzip, body not gzip' '400 JSON' -H "$J" -H 'Content-Encoding: gzip' -d '{"username":"x","password":"y"}'
p C07 POST /api/login 'Content-Encoding: br (unsupported)' '415 JSON' -H "$J" -H 'Content-Encoding: br' -d '{"username":"x","password":"y"}'
p C08 POST /api/bugs 'empty body with application/json' '400 blank_title' -H "$J" --data-binary ''
p C09 POST /api/bugs 'body is a JSON array' '400 JSON' -H "$J" -d '[1,2]'
p C10 POST /api/bugs 'body is a JSON string (strict)' '400 JSON' -H "$J" -d '"x"'
p C11 GET /api/bugs 'Accept: application/xml' '200 JSON or 406'  -H 'Accept: application/xml'

# --- large bodies ---
node -e 'process.stdout.write(JSON.stringify({title:"[contract] big",severity:"low",owner:"buggy",description:"x".repeat(200*1024)}))' > "$DIR/big.json"
node -e 'process.stdout.write(JSON.stringify({title:"[contract] ninety "+"t".repeat(20), severity:"low",owner:"buggy",description:"x".repeat(90*1024)}))' > "$DIR/ninety.json"
p L01 POST /api/bugs '200 KB body (> 100kb limit)' '413 JSON' -H "$J" --data-binary @"$DIR/big.json"
p L02 PUT "/api/bugs/${P}" '200 KB body' '413 JSON' -H "$J" --data-binary @"$DIR/big.json"
p L03 POST /api/bugs '90 KB description (under limit)' '201 or 400 too_long' -H "$J" --data-binary @"$DIR/ninety.json"
p L04 POST /api/bugs '10k-char title' '400 too_long?' -H "$J" -d "{\"title\":\"[contract] $(printf 't%.0s' $(seq 1 10000))\",\"severity\":\"low\",\"owner\":\"buggy\",\"description\":\"d\"}"

# --- routing edges ---
p E01 GET /api/bugs/ 'trailing slash' '200'
p E02 GET /API/BUGS 'upper-case path' '404?'
p E03 GET "/api/bugs/${P}/" 'id trailing slash' '200'
p E04 GET "/api/bugs/${P}/extra" 'extra segment' '404 JSON'
p E05 GET /api/bugs/99999999999999999999 'huge id' '404 or 400'
p E06 GET /api/bugs/0 'zero id' '400 invalid_id'

# cleanup: only [contract] bugs this run created
curl -s "$B/api/bugs" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>JSON.parse(s).filter(b=>b.title.startsWith("[contract]")).forEach(b=>console.log(b.id)))' > "$DIR/cleanup-ids.txt"
while read -r id; do curl -s -o /dev/null -w "cleanup DELETE $id -> %{http_code}\n" -X DELETE "$B/api/bugs/$id"; done < "$DIR/cleanup-ids.txt"
rm -f "$DIR/big.json" "$DIR/ninety.json"
