# Security (incl. authentication) — run 2026-09-22T205320Z

**Verdict:** not-ready. **Confidence:** high.

The API has no authentication. An anonymous caller can read, create, edit and delete every bug. "Logged in" is only a username the browser keeps in localStorage, and anyone can forge it. The backend also listens on all interfaces. Most of this predates the diff (baseline cce584c). The diff's own security change is one more plaintext credential in tracked `users.json`.

## Findings

| id | title | status | severity |
|---|---|---|---|
| security-01 | Every /api/bugs verb works with no session | confirmed | critical |
| security-02 | Session is a localStorage flag; a forged or non-existent user opens the board | confirmed | high |
| security-03 | Logout is client-only; the stored value replays | confirmed | medium |
| security-04 | Diff adds plaintext `matt` / `<redacted>` to tracked users.json | confirmed | medium |
| security-05 | No rate limiting or lockout on POST /api/login | confirmed | medium |
| security-06 | Non-string login fields and bad bodies return stack traces with absolute paths | confirmed | medium |
| security-07 | Backend binds `*:3002` (UI binds `[::1]:5173`) | confirmed | medium |
| security-08 | No security headers; `X-Powered-By: Express` | hardening | low |
| security-09 | Lax id parsing (`1e3`, `1 OR 1=1` resolve to bug 1) | hardening | low |
| security-10 | No per-field length limit (90 KB title stored) | hardening | low |
| security-11 | Specs have no security requirements | gap | medium |

Full evidence, repro steps and fixes are in `findings/security.json`.

## Key evidence

Unauthenticated calls (no cookie, no header). `evidence/security/unauth-probe-{1,2}.txt`:

```
POST   /api/bugs     -> 201 {"id":4,"title":"[security] unauth create",...}
GET    /api/bugs     -> 200 [full list]
GET    /api/bugs/4   -> 200
PUT    /api/bugs/4   -> 200 {"title":"[security] unauth edited",...,"state":"CLOSED"}
DELETE /api/bugs/4   -> 204 ; GET afterwards -> 404
```

Forged session: `localStorage.buggyboard_user = {"username":"ghost-not-in-users-json"}` loads `/board` with 11 rows (`forged-session-board.png`). Logout sends no request to the server. `/api/bugs` still returns 200 afterwards, and writing the old value back restores the board (`logout-replay-board.png`).

Stack trace: `POST /api/login {"username":123,"password":"x"}` returns 500 `TypeError: username.trim is not a function at login (/Users/.../backend/src/authService.ts:19:36)`.

## What held

- **XSS:** these payloads were stored in title, owner and description: `<img src=x onerror=...>`, `<script>`, `<svg onload>` and `javascript:`. They render as inert text on the board, in the edit modal fields and in the delete confirm. `window.__xss` stayed null, no dialogs fired and no injected nodes appeared (`xss-board.png`, `xss-edit-modal.png`, `xss-delete-confirm.png`). There is no `dangerouslySetInnerHTML` in `frontend/src`.
- **SQL injection:** every query is a prepared statement. `'; DROP TABLE bugs;--`, `' OR '1'='1` and `DELETE FROM bugs` were stored as literal text, and `/api/health` stayed healthy. Id metacharacters are cut off by `parseInt`, not executed (see security-09).
- **CORS:** `Access-Control-Allow-Origin` is fixed to `http://localhost:5173` and is not reflected for `Origin: http://evil.example`. A `text/plain` cross-origin POST is not parsed (400 blank_title), so the browser simple-request CSRF path is closed. That does not stop non-browser callers (security-01).
- **Login oracle:** unknown user and wrong password return the same 401 `Invalid username or password.` A blank password returns the same message for known and unknown users. Single-sample timings were about 1.2 ms for both.
- **Body limit:** the `express.json` default is 100 KB, not 1 MB. The 150 KB and 1.1 MB bodies both returned 413, and the server stayed up.
- **Dependencies:** `npm audit --omit=dev --json` reported 0 vulnerabilities (`npm-audit.json`).

## Diff slice

- `users.json`: adds a plaintext credential (security-04).
- Port 3000 → 3002 and the Vite proxy change: no security effect. The all-interfaces bind (security-07) is pre-existing.
- `.gitignore`: the Playwright output dirs are ignored. The `@playwright/test` devDependency is not in the production audit.

## Cannot establish here

This is a local dev server over plain HTTP. TLS, HSTS, cookie flags (the app sets no cookies) and production headers cannot be observed, and Vite dev document headers are not production headers. Express shows stack traces only when `NODE_ENV` is not `production`, so security-06 may not appear in a production build. Off-host reachability of `:3002` was not probed. Authorization is out of scope (no role model).

## Cleanup

Bugs 4, 5 and 6 (all `[security]`-prefixed) were deleted, and no `[security]` bugs remain.

Scripts and output: `evidence/security/browser-probe.mjs`, `browser-probe-output.json`, `*.txt`, `*.png`, `npm-audit.json`.
