#!/bin/sh
# Anonymous API probes. No cookies or auth headers are ever sent. Passwords are read from users.json
# at runtime and never echoed; logged request bodies show <redacted>.
B=${B:-http://localhost:3002}
V=http://localhost:5173
J='Content-Type: application/json'
say() { printf '\n### %s\n' "$*"; }

say "create a [security] bug anonymously (proxied)"
R=$(curl -s -X POST $V/api/bugs -H "$J" -d '{"title":"[security] anon PUT target","severity":"low","owner":"nobody","description":"d"}')
echo "$R"; ID=$(echo "$R" | node -pe 'JSON.parse(require("fs").readFileSync(0)).id')

say "PUT /api/bugs/$ID with no session (proxied)"
curl -s -w '\nHTTP %{http_code}\n' -X PUT $V/api/bugs/$ID -H "$J" -d '{"title":"[security] anon PUT edited","severity":"high","owner":"nobody","description":"edited anonymously","state":"closed"}'
say "GET /api/bugs/$ID after anon PUT"
curl -s -w '\nHTTP %{http_code}\n' $V/api/bugs/$ID
say "PUT /api/bugs/$ID with no session (direct :3002)"
curl -s -w '\nHTTP %{http_code}\n' -X PUT $B/api/bugs/$ID -H "$J" -d '{"title":"[security] anon PUT direct","severity":"medium","owner":"nobody","description":"x","state":"open"}'

say "id edge cases on PUT against my own bug: '$ID.9' and '${ID}e0' and '$ID%20OR%201=1'"
for s in "$ID.9" "${ID}e0" "$ID%20OR%201=1"; do printf '%s -> ' "$s"; curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$V/api/bugs/$s" -H "$J" -d '{"title":"[security] lax id PUT","severity":"low","owner":"nobody","description":"x","state":"open"}'; done
curl -s $V/api/bugs/$ID; echo
say "GET id edge cases"
for s in 1e3 1.9 '1%20OR%201=1' abc 0 -1 99999999999999999999; do printf '%s -> ' "$s"; curl -s -o /dev/null -w '%{http_code}\n' "$V/api/bugs/$s"; done

say "DELETE /api/bugs/$ID with lax id '${ID}.5' (own bug)"
curl -s -w 'HTTP %{http_code}\n' -X DELETE "$V/api/bugs/${ID}.5"
curl -s -w '\nHTTP %{http_code}\n' $V/api/bugs/$ID

say "CORS preflight from foreign origin"
curl -s -i -X OPTIONS $B/api/bugs/1 -H 'Origin: http://evil.example' -H 'Access-Control-Request-Method: DELETE' | tr -d '\r' | grep -i -E '^HTTP|access-control'
say "CORS simple text/plain POST from foreign origin"
R=$(curl -s -i -X POST $B/api/bugs -H 'Origin: http://evil.example' -H 'Content-Type: text/plain' -d '{"title":"[security] cors text/plain","severity":"low","owner":"x","description":"x"}' | tr -d '\r')
echo "$R" | grep -i -E '^HTTP|access-control'; echo "$R" | tail -1

say "headers on /api/health"
curl -s -i $B/api/health | tr -d '\r' | sed -n '1,/^$/p'

say "login error disclosure: non-string username, malformed JSON, oversized body"
curl -s -w '\nHTTP %{http_code}\n' -X POST $B/api/login -H "$J" -d '{"username":123,"password":"x"}' | head -c 400; echo
curl -s -w '\nHTTP %{http_code}\n' -X POST $B/api/login -H "$J" -d '{bad' | head -c 300; echo
node -e 'process.stdout.write(JSON.stringify({title:"[security] big","severity":"low",owner:"x",description:"A".repeat(150000)}))' > /tmp/sec-big-150k.json 2>/dev/null || true
