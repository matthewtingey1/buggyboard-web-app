#!/bin/sh
# Security API probe, run 2026-09-22T230611Z. Anonymous: no cookie or auth header anywhere.
U=http://localhost:5173/api
D=http://127.0.0.1:3002/api
r() { echo "\$ $*"; "$@"; echo; echo; }
echo "== security-01 anonymous verbs =="
BODY=$(curl -s -X POST $U/bugs -H 'Content-Type: application/json' -d '{"title":"[security] anon create","severity":"low","owner":"nobody","description":"created anonymously"}')
echo "POST /api/bugs (anon) -> $BODY"
ID=$(echo "$BODY" | sed -E 's/.*"id":([0-9]+).*/\1/')
r curl -s -o /dev/null -w 'GET /api/bugs (anon) %{http_code}\n' $U/bugs
r curl -s -w ' %{http_code}' -X PUT $U/bugs/$ID -H 'Content-Type: application/json' -d '{"title":"[security] anon PUT edited","severity":"high","owner":"nobody","description":"edited anonymously","state":"closed"}'
r curl -s -w ' %{http_code}' $U/bugs/$ID
echo "== security-09 id strictness on own bug $ID =="
for p in "$ID.9" "${ID}e0" "$ID%20OR%201=1" "$ID;DROP%20TABLE%20bugs" "0$ID" "+$ID" "0" "-1" "99999999999999999999" "abc" "%E0%A4%A"; do
  printf 'GET /api/bugs/%s -> ' "$p"; curl -s -w ' %{http_code}\n' "$U/bugs/$p"
done
printf 'PUT /api/bugs/%s.9 -> ' "$ID"; curl -s -w ' %{http_code}\n' -X PUT "$U/bugs/$ID.9" -H 'Content-Type: application/json' -d '{"title":"[security] x","severity":"low","owner":"o","description":"d","state":"open"}'
printf 'DELETE /api/bugs/%s.5 -> ' "$ID"; curl -s -w ' %{http_code}\n' -X DELETE "$U/bugs/$ID.5"
printf 'GET /api/bugs/%s (still there?) -> ' "$ID"; curl -s -o /dev/null -w '%{http_code}\n' "$U/bugs/$ID"
echo "== security-06 error bodies =="
r curl -s -w ' %{http_code} %{content_type}' -X POST $D/login -H 'Content-Type: application/json' -d '{"username":123,"password":"x"}'
r curl -s -w ' %{http_code} %{content_type}' -X POST $D/login -H 'Content-Type: application/json' -d '{"username":["buggy"],"password":"x"}'
r curl -s -w ' %{http_code} %{content_type}' -X POST $D/login -H 'Content-Type: application/json' -d '{"username":{"toString":1},"password":"x"}'
r curl -s -w ' %{http_code} %{content_type}' -X POST $D/login -H 'Content-Type: application/json' -d '{bad json'
r curl -s -w ' %{http_code} %{content_type}' -X POST $D/login -H 'Content-Type: application/json; charset=latin1' -d '{"username":"a","password":"b"}'
r curl -s -w ' %{http_code} %{content_type}' -X POST $D/login -H 'Content-Type: application/json' -H 'Content-Encoding: gzip' -d '{"username":"a","password":"b"}'
r curl -s -w ' %{http_code} %{content_type}' -X POST $D/bugs -H 'Content-Type: text/plain' -d '{"title":"[security] text/plain"}'
r curl -s -w ' %{http_code} %{content_type}' -X POST $D/bugs -H 'Content-Type: application/x-www-form-urlencoded' -d 'title=[security]+form'
r curl -s -w ' %{http_code} %{content_type}' -X POST $D/bugs -H 'Content-Type: application/json' -d '[1,2]'
r curl -s -w ' %{http_code} %{content_type}' -X POST $D/bugs -H 'Content-Type: application/json' -d '"str"'
r curl -s -w ' %{http_code} %{content_type}' -X PATCH $D/bugs/1
r curl -s -w ' %{http_code} %{content_type}' $D/nope
echo "== security-08 headers (direct and via proxy) =="
r curl -s -D - -o /dev/null $D/health
r curl -s -D - -o /dev/null $U/health
r curl -s -D - -o /dev/null http://localhost:5173/board
echo "== CORS foreign origin =="
r curl -s -i -X OPTIONS $D/bugs/1 -H 'Origin: http://evil.example' -H 'Access-Control-Request-Method: DELETE'
echo "== security-14 Host header (DNS rebinding precondition) =="
printf 'backend  Host: evil.example GET /api/bugs -> '; curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: evil.example:3002' $D/bugs
printf 'vite     Host: evil.example GET /api/bugs -> '; curl -s -w ' %{http_code}\n' -H 'Host: evil.example:5173' $U/bugs | tail -c 200
printf 'backend  Host: evil.example DELETE own bug -> '
B2=$(curl -s -X POST $D/bugs -H 'Content-Type: application/json' -d '{"title":"[security] rebinding target","severity":"low","owner":"o","description":"d"}')
ID2=$(echo "$B2" | sed -E 's/.*"id":([0-9]+).*/\1/')
curl -s -o /dev/null -w "%{http_code} (id $ID2)\n" -X DELETE -H 'Host: evil.example:3002' $D/bugs/$ID2
echo "== security-07 listeners =="
lsof -nP -iTCP:3002 -iTCP:5173 -sTCP:LISTEN
echo "== cleanup own bug $ID =="
curl -s -o /dev/null -w 'DELETE /api/bugs/%{url_effective} %{http_code}\n' -X DELETE $U/bugs/$ID
