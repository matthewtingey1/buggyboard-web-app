#!/bin/sh
# Rate limiter design probe. Throwaway usernames only; no real account is sent a failed login.
D=http://127.0.0.1:3002/api
R=$(od -An -N4 -tx4 /dev/urandom | tr -d ' ')
post() { curl -s -o /dev/null -w '%{http_code} ' -X POST $D/login -H 'Content-Type: application/json' -d "{\"username\":\"$1\",\"password\":\"$2\"}"; }
echo "== 1. third party locks a username it does not own (upper-case variant, counted against the lower-case key) =="
V="PROBE-SECURITY-$R"; T="probe-security-$R"
printf '20 wrong for %s: ' "$V"; for i in $(seq 1 20); do post "$V" "wrong$i"; done; echo
printf 'next attempt as %s: ' "$T"; curl -s -D - -X POST $D/login -H 'Content-Type: application/json' -d "{\"username\":\"  $T \",\"password\":\"anything\"}"; echo; echo
echo "== 2. spraying one password across 25 usernames: no global or per-client limit =="
printf 'codes: '; for i in $(seq 1 25); do post "probe-security-spray-$R-$i" "Summer2026"; done; echo; echo
echo "== 3. map growth: every distinct failed username is kept in process memory =="
PID=$(lsof -nP -tiTCP:3002 -sTCP:LISTEN)
BIG=$(head -c 90000 /dev/zero | tr '\0' 'a')
printf 'RSS before (KB): '; ps -o rss= -p $PID
i=1; codes=""
while [ $i -le 200 ]; do
  printf '{"username":"probe-security-big-%s-%s-%s","password":"x"}' "$R" "$i" "$BIG" > /tmp/.sec-big-$$.json 2>/dev/null || printf '{"username":"probe-security-big-%s-%s-%s","password":"x"}' "$R" "$i" "$BIG" > big.json
  f=/tmp/.sec-big-$$.json; [ -f big.json ] && f=big.json
  codes="$codes$(curl -s -o /dev/null -w '%{http_code} ' -X POST $D/login -H 'Content-Type: application/json' --data-binary @$f)"
  i=$((i+1))
done
rm -f /tmp/.sec-big-$$.json big.json
echo "200 x 90 KB usernames: $(echo $codes | tr ' ' '\n' | sort | uniq -c | tr '\n' ' ')"
sleep 3
printf 'RSS after (KB): '; ps -o rss= -p $PID
curl -s $D/health; echo
