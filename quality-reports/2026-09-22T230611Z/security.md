# Security — run 2026-09-22T230611Z

**Verdict: not-ready. Confidence: high.**

Anonymous API access (security-01, critical) is still open by product decision. The new login limiter fixes brute force, but it adds a way to deny service: any anonymous caller can lock any username for 15 minutes and keep it locked (security-14, high). Most of the other claimed fixes check out.

Baseline: OWASP Top 10 and ASVS L1, because the specs have no security requirements (security-11). This is a local dev server over plain HTTP, so TLS, cookie flags and production headers can't be observed.

## Carried forward (run 2026-09-22T222029Z)

| id | status now | note |
|---|---|---|
| security-01 | confirmed, critical | Anonymous POST/GET/PUT/DELETE all work. Anonymous PUT has no guard. Exposure is narrower: loopback bind, and 415 blocks cross-site simple POSTs. |
| security-02 | confirmed, high | The test.fail guard passes. A forged value planted in a second tab opens the board. |
| security-03 | confirmed, medium | Logout makes no server call, and replaying the saved value opens /board. The cross-tab logout fix works (client-side only). |
| security-04 | fixed | Not in any commit. The working-tree users.json still has matt, unstaged. |
| security-05 | fixed | Throwaway name: 20 x 401, then 429. The design issues are filed as 14, 15 and 16. |
| security-06 | fixed | Every error path tried returns JSON with no stack. |
| security-07 | fixed | 127.0.0.1:3002. |
| security-08 | fixed | nosniff, DENY, no-referrer, no X-Powered-By. There is no CSP on the JSON API; not reopened. |
| security-09 | fixed | Strict ids return 400. The own-bug DELETE of `<id>.5` was refused. |
| security-10 | hardening, low | A 90 KB title is still stored. |
| security-11 | gap, medium | specs/features is unchanged. |
| security-12 | hardening, low | Clean in the working tree and index. Still in pushed commits a7fa601/ffb95fd: 11 files, 1,161 lines, plus 2 trace.zip files with the home path. |
| security-13 | hardening, low | Passwords are still plaintext. |

## New

- **security-14 (high, confirmed).** The lockout key is `username.trim().toLowerCase()` and nothing else. After 20 bad passwords sent as `PROBE-SECURITY-<r>`, the next attempt as `probe-security-<r>` got a 429. The 429 check runs before `login()`, so a locked user's correct password is refused too. That part is read from code; I didn't exercise it on a real account. The window counts from the first failure, so 20 requests every 15 minutes keep an account locked indefinitely. Fix: key on client IP + username, or use an increasing per-attempt delay instead of a hard lock.
- **security-15 (low, confirmed).** Every distinct failed username stays in the Map. 200 x 90 KB usernames raised backend RSS from 76 MB to 99 MB.
- **security-16 (low, hardening).** There is no per-client or global limit: 25 usernames sprayed with one password all got 401. State lives only in process memory, so every tsx restart clears it. 429 responses send no Retry-After.
- **security-17 (medium, potential).** `Host: evil.example` sent directly to :3002 got 200 on GET and 204 on DELETE. Vite returns 403 for the same Host. That makes DNS rebinding the remaining route for a web page to use security-01. The full attack was not run.

## Injection

Title, owner and description were stored verbatim and rendered as text on the board and in the edit modal. The payloads were `<script>`, `<svg onload>`, `<img onerror>`, `<iframe src=javascript:>` and SQL metacharacters. There were 0 element nodes in the row, `window.__xss` stayed unset, and no dialogs appeared (screenshots: xss-board.png, xss-edit-modal.png). The prepared statements held. frontend/src has no `dangerouslySetInnerHTML` or `innerHTML`.

## Suite

- auth.spec.ts: 6/6 passed.
- security.spec.ts: 4/4 passed.
- The test.fail guards cover anonymous GET/POST/DELETE only.
- Nothing guards anonymous PUT, logout replay (security-03), Referrer-Policy, or the lockout DoS.

## Dependencies

`npm audit --omit=dev` and the full `npm audit` both report 0 vulnerabilities.

## Evidence

evidence/security/:
- api-probe.txt
- ratelimit-probe.txt
- resource-probe.txt
- browser-probe-output.json and the screenshots
- history-leak-check.txt
- npm-audit-*.json
- scoped-*-spec.txt
