# Security: run 2026-09-22T222029Z

**Verdict: not-ready. Confidence: high.**

The API still has no authentication. An unauthenticated caller can read, create, edit and delete every bug on `localhost:3002`, and that port listens on all interfaces. The personal credential from run 1 (security-04) is fixed: it is in no commit on any ref I can see. Stored XSS and SQL injection still fail: React escapes the text and the statements are prepared. `npm audit` is clean.

## Re-test of run-1 findings

| id | title | sev | now | how |
|---|---|---|---|---|
| security-01 | Every /api/bugs verb works with no session | critical | still reproduces | PUT tested by hand (200, bug 3145 edited to CLOSED); GET/POST/DELETE covered by passing `test.fail` guards in `tests/api/auth.spec.ts` |
| security-02 | localStorage session; any name opens the board | high | still reproduces | `test.fail` guard in `tests/security/security.spec.ts` passed |
| security-03 | Logout is client-only; stored value replays | medium | still reproduces | headless: no cookies, no logout request, `/api/bugs` 200 after logout, replayed value reopens `/board` |
| security-04 | Personal plaintext password in tracked users.json | medium | **fixed** | `HEAD:users.json` has only buggy/vanny; `git log --all -S<pw>` and `git grep` over every reflog commit (including the force-pushed-over f296bf0) find nothing |
| security-05 | No rate limiting on /api/login | medium | still reproduces | 30 x 401, then 200 with the right password; no Retry-After |
| security-06 | HTML stack traces with absolute paths | medium | still reproduces | numeric/array username -> 500 trace; bad JSON -> 400 trace; >100 KB -> 413 trace |
| security-07 | Backend bound to *:3002 | medium | still reproduces | lsof `*:3002` vs `[::1]:5173` |
| security-08 | X-Powered-By, no security headers | low | still reproduces | curl; X-Powered-By is also guarded by `test.fail` |
| security-09 | Lax id parsing | low | still reproduces, now shown on writes | on my own bug: `PUT /3145e0` and `/3145.9` -> 200; `DELETE /3145.5` -> 204, then 3145 is gone |
| security-10 | No per-field length cap | low | still reproduces | 90,016-char title -> 201 (deleted afterwards); 150 KB and 1.1 MB -> 413 |
| security-11 | No security requirements in specs | gap | unchanged | branch adds test plans only |

The remaining risk on security-04 is that the working tree still has the matt account as an uncommitted change (`M users.json`), so a `git commit -a` would bring it back. I did not query PR #1 on GitHub. Local `origin/e2e-suite-and-quality-run` equals HEAD `ffb95fd`.

## New findings

- **security-12 (hardening, low).** Committed `quality-report/` and `quality-reports/2026-09-22T205320Z/` expose `/Users/<user>/...` in 10 files, including full Express stack traces with `node_modules` paths. Fix: replace the repo root with a placeholder before committing evidence, or gitignore evidence.
- **security-13 (hardening, low).** `users.json` stores passwords in plaintext, and `authService.ts:33` compares them with `!==`. This was split out of security-04. The accounts are published demo credentials, and hashing is ASVS L2.

## Public-repo secret scan

The committed tree and the history `origin/main..HEAD` (plus pre-rebase reflog commits) contain:
- no personal password, including inside both committed `trace.zip` files (unpacked and grepped);
- no tokens or keys, checked for the patterns `ghp_`, `github_pat_`, `sk-`, `AKIA`, `xox`, private keys, Bearer and `api_key`;
- no email addresses, because commit authors are GitHub noreply.

The buggy/vanny passwords do appear in `.claude/agents/*`, `learning.md` and run-1 evidence scripts. They are already public upstream in `specs/features/02-user-accounts.md`, so this is not a new disclosure.

`test-history/` is gitignored. `playwright.config.ts` stores no credentials and traces only on CI retry.

## Injection (not findings)

Payloads were stored through the API and viewed on the board and in the edit modal: `<script>window.__xss='script'</script>`, `<svg onload=...>` and `'; DROP TABLE bugs; -- " OR 1=1 /*`, across title, owner and description. `window.__xss` stayed null, no script or svg nodes were injected, no dialogs appeared, and the text round-tripped exactly. `/api/bugs` still returned 200, so the prepared statements held. The `<img onerror>` payload in the delete confirmation is already guarded by the suite. Screenshots: `evidence/security/xss2-board.png` and `xss2-edit-modal.png`.

## CORS

`Access-Control-Allow-Origin` is fixed at `http://localhost:5173`, so a foreign browser origin cannot read responses. A cross-origin `text/plain` POST still reaches the handler: it returned 400 only because the body is not parsed as JSON. CORS does not stop non-browser callers (security-01).

## Dependencies

`npm audit --omit=dev` and a full `npm audit` both report 0 vulnerabilities across 469 dependencies (`evidence/security/npm-audit-*.json`).

## Not established here

- TLS, HSTS, cookie flags and production headers: this is a plain-HTTP dev server, it issues no cookies, and the Vite dev headers are not production headers.
- Off-host reachability of `*:3002`.
- PR #1 as GitHub shows it.
- The `$HOME/.claude/skills` scripts behind `quality:*`: they live outside the repo and were not reviewed.

## Evidence

`evidence/security/` contains `api-probe.sh`/`.txt`, `login-resource-probe.txt`, `browser-probe.mjs` and `browser-probe-output.json`, `logout-replay-board.png`, `xss2-*.png`, `scoped-security-spec.txt`, `scoped-auth-spec.txt`, `npm-audit-omit-dev.json` and `npm-audit-all.json`. Passwords are read from `users.json` at runtime and redacted in the logs, and home paths are replaced with `~`/`<user>`. All `[security]` bugs I created (3145, 3162, 3239) were deleted.
