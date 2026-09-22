# Quality run report contract

Every testing agent on the team writes to the same place, in the same
shape, so one run produces one reviewable result instead of N conversations.

## The run folder

One run, one folder, created once and shared by every agent in that run:

```
quality-reports/<RUN_ID>/
  summary.md                    release lead only — the verdict and the merged finding table
  <slug>.md                     that agent's narrative report
  findings/<slug>.json          that agent's findings, machine-readable
  evidence/<slug>/              screenshots, traces, payload logs, scoped test output
```

`RUN_ID` is a UTC stamp: `2026-09-22T155936Z`. Create it with `quality-run.sh`, which prints the
id and scaffolds the folder. **If you were given a `RUN_ID`, use it — never make your own.** An
agent run on its own creates one and says so.

One file per agent is deliberate: agents run in parallel, and a shared file would be clobbered.

## Slugs

One short slug per agent, used for every filename in the run and for the `agent` field in the
JSON. They are fixed, because the merge matches on them.

| Agent | Slug |
|---|---|
| `functional-agent` | `functional` |
| `a11y-auditor` | `a11y` |
| `security-agent` | `security` |
| `api-contract-agent` | `contract` |
| `data-integrity-agent` | `data` |
| `exploratory-agent` | `exploratory` |
| the release lead | owns `summary.md`; writes no findings file of its own |

Deliberately unowned: authorization (no role model — authentication is folded into `security`),
branding/theme, performance, i18n, file handling.

## findings/&lt;slug&gt;.json

```json
{
  "agent": "a11y",
  "run": "2026-09-22T155936Z",
  "scope": "what you actually exercised",
  "verdict": "ready | ready-with-known-risk | not-ready | insufficient-evidence",
  "confidence": "high | medium | low",
  "commands": ["the exact commands you ran"],
  "findings": [
    {
      "id": "a11y-01",
      "title": "one line",
      "status": "confirmed | potential | gap | hardening | fixed",
      "severity": "critical | high | medium | low",
      "requirement": "the clause it violates",
      "location": "file:line",
      "evidence": "what was observed, not what was expected",
      "repro": "exact steps or a runnable snippet",
      "fix": "the smallest change that fixes it"
    }
  ],
  "notTested": ["what you deliberately or unavoidably left uncovered"]
}
```

**Severity**, applied across the whole team: **critical** = the user cannot complete the journey,
code execution, or data leaving the device; **high** = a wrong name/role/state, persisted or
recoverable user data, a wrong result; **medium** = a measured conformance failure, a contract
break, data in a place it should not be; **low** = quality, polish, bounded resource use.

`confirmed` needs evidence. Anything you could not demonstrate is `potential`, and an uncovered
requirement is `gap` — a finding in its own right, not a blank space. A gap is not a defect, and
the two are never merged into one number. `fixed` is a previous finding you re-tested and could
no longer reproduce; keep it in the file so the history survives.

## Carrying findings forward

When the dispatch names a previous run, re-test every finding in that run's `findings/<slug>.json`
before looking for new ones. Keep each id, and record it as still reproducing, `fixed`, or not
re-tested with the reason. New findings take the next free number. A previous finding that no one
mentions is a gap in the run, not a pass.

## Running the suite without colliding

The test reporter's output directories are shared by every run. Only the release lead runs the
full suite, once, before dispatch, with a plain `npx playwright test` — no `--reporter` flag, so the
archiving reporter writes `test-history/<run>/run.json` for the quality report. Specialists scope their
own runs and keep output inside their evidence folder:

```sh
npx playwright test <spec> --project=chromium --reporter=line --workers=1 \
  --output=quality-reports/<RUN_ID>/evidence/<slug>/test-results
```

`--reporter=line` replaces the configured reporter list, so a scoped run writes no HTML report
and archives no history. HTTP-only specs (`tests/api/`, `tests/data/`) run in the browserless
`api` project: use `--project=api` for them. `--workers=1` matters when several agents run at once: worker
contention produces timeouts that read exactly like product defects.

The app and its data are shared too. Tag every record you create with your slug (for example a
`[a11y]` title prefix), delete only your own, and never assert on totals or an empty list. Never
reset the database, edit seed or user files, or restart servers during a run. The permanent suite
tags its records `[e2e]`, so a leftover `[e2e]` row is a suite defect worth reporting.

Login is rate-limited: 20 failed attempts in a row lock that client and username for 15 minutes. Never send more
than a couple of failed logins for a real account, since a lock breaks every other agent. Do lockout and
brute-force probes with throwaway usernames.

No passwords in any file you write, apart from the public defaults in `specs/features/02-user-accounts.md`.
Read other accounts from `users.json` at runtime and write their passwords as `<redacted>`. The fork
is public, and a credential in evidence gets published with it.

## Merging

`quality-summary.js <RUN_ID>` merges every `findings/*.json` into the tables in `summary.md`. The
release lead owns the verdict above them; the tables are generated, so do not hand-edit them.

Judgement that outlives one run — a capability's product risk, or why its evidence is only
partial — belongs in `quality-model.json`, not in a run folder.
