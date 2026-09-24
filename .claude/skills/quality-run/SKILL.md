---
name: quality-run
description: Run a new BuggyBoard quality run end to end — open a run, run the full Playwright suite once as lead, dispatch the six specialist agents in parallel, reconcile their findings against the previous run, write the verdict, and rebuild and verify the quality report. Trigger on "do a quality run", "new quality run", "re-run the quality team", "get a new verdict", or /quality-run.
---

# BuggyBoard quality run

You are the release lead. The six specialists do the testing; you open the run, run the full suite, dispatch, reconcile and write the verdict. The run contract is `quality-reports/REPORT-CONTRACT.md` — read it first.

Arguments (optional): a baseline ref. Default baseline is `origin/main`; the candidate is always the working tree.

## 1. Preflight

```sh
curl -s http://localhost:5173/api/health          # must return {"ok":true,...}
ls .claude/agents                                   # six agents, names match the contract's slug table
ls -d quality-reports/20*/ | tail -1                # the previous run, if any
git diff --stat <baseline>                          # the candidate diff
```

If the app is down, stop and ask the user to run `npm run dev` — never start or restart servers yourself during a run.

## 2. Open the run and run the suite

```sh
npm run -s quality:run                              # prints RUN_ID and scaffolds quality-reports/<RUN_ID>/
npx playwright test 2>&1 | tee quality-reports/<RUN_ID>/evidence/lead/full-suite.txt
```

Run the suite **plain** — any `--reporter` flag replaces the configured reporters and the run is not archived to `test-history/`, so the report never sees it. The configured `list` reporter is what fills `full-suite.txt`; if it comes out empty, rebuild it from the newest `test-history/*/run.json`. Run it before dispatching, never while agents run. Record: total, passed, skipped, failed, and how many `test.fail` known-defect guards there are (`grep -rc "test.fail(" tests`). An unexpected pass on a `test.fail` test means a defect was fixed — note which.

## 3. Dispatch all six in one message

Send every agent in a **single message** so they run concurrently: `functional-agent`, `a11y-auditor`, `security-agent`, `api-contract-agent`, `data-integrity-agent`, `exploratory-agent`. Give each the same block, filled in:

```
Quality run dispatch from the release lead. Follow your agent contract and quality-reports/REPORT-CONTRACT.md exactly.

RUN_ID: <RUN_ID> (use it; do not create your own). Slug: <slug>.
Candidate: working tree. Baseline: <baseline> (<sha>).
Previous run: quality-reports/<PREV_RUN_ID>/ — read findings/<slug>.json. For each previous finding, re-test it and say
whether it still reproduces (keep the same id), is fixed (status "fixed"), or could not be re-tested (say why).
Only then look for new findings; give new ones the next free number.
Your slice of the diff: <the files in the diff that concern this dimension, or "none — test the product as it stands">.
Automated coverage now in tests/ for your dimension: <paths>. (Functional also gets specs/testing/*.md: rows marked ✅ or 🔒 are automated; ⏸ rows wait on a product decision.) Don't re-measure by hand what a passing test already
guards; spend the time on what nothing guards. A test.fail guard is a known defect, not coverage of the fix.

App: UI http://localhost:5173, API http://localhost:5173/api (proxied) or http://localhost:3002/api.
Lead's full-suite run: <passed>/<total> passed, <skipped> skipped, <failed> failed.

Rules:
- Scoped runs only: npx playwright test <spec> --project=chromium (api for tests/api and tests/data) --reporter=line --workers=1
  --output=quality-reports/<RUN_ID>/evidence/<slug>/test-results. Headless only; no Playwright MCP tools.
- Scripts and scratch specs go in quality-reports/<RUN_ID>/evidence/<slug>/, never tests/.
- Prefix every bug you create with [<slug>], delete only your own, never assert on totals or an empty list.
- Never reset the DB, edit users.json or seed data, restart servers, or change application code.
- Never write a password from users.json into any file. Refer to the personal account's password as <redacted>
  and read credentials from users.json at runtime.
- LOGIN IS RATE-LIMITED: 20 consecutive failed logins lock a client+username for 15 minutes. At most two or three
  failed logins for real accounts; use throwaway usernames like probe-<slug>-<random> for lockout probes.
- Deliverables: quality-reports/<RUN_ID>/<slug>.md and quality-reports/<RUN_ID>/findings/<slug>.json.
  Reply with: verdict, confidence, and each finding id + title + severity + status.
```

Wait for every agent to report. Relay each report to the user in two or three lines as it lands.

**Don't touch `tests/` while agents run** — they run scoped specs from it. Agents do report defects in the suite itself (leaked rows, ambiguous locators, weak assertions). Queue those and fix them after the last report, then re-run the full suite plain and check residue:

```sh
curl -s localhost:5173/api/bugs | node -e 'const b=JSON.parse(require("fs").readFileSync(0));console.log(b.filter(x=>x.title.startsWith("[e2e]")||/^[\u200B\u2060\s]*$/.test(x.title)).map(x=>x.id))'
```

Fixes you make to the app after the run are verified by your guard tests, not by the agents. Before relying on a guard, disable its fix and confirm it fails. Record them as a `fixed` lead finding and say the next run must re-confirm them. Watch especially for regressions your own earlier fixes caused: the agents are told the diff, and they will find them.

Record the suite fixes as a `fixed` lead finding (`LEAD-n` in `quality-model.json`) with the agent findings folded into it, so the report shows them as found and fixed rather than open.

## 4. Reconcile

Read every narrative report, then:

- **Missing report = gap, not pass.** Check `quality-reports/<RUN_ID>/findings/` has all six files.
- **Carry-forward:** every previous finding must be marked still-reproducing, fixed, or not re-tested. A previous finding nobody mentioned is a gap in the run.
- **Duplicates:** fold one defect reported by several agents into one surviving id; keep every measurement. Record folds in the `reconciliation` map in `quality-model.json` (`{"<survivor>": ["<folded>", ...]}`) — carry over the previous map where the ids still apply.
- **Conflicting fixes:** pick one and say why; name the decision a human owns when it trades one property for another.
- **Contradictions:** state one shared observation with both readings.
- **Hygiene:** `curl -s localhost:5173/api/bugs | grep -oE '\[(functional|a11y|security|contract|data|exploratory)\]' | sort | uniq -c` must print nothing.

## 5. Merge and verdict

```sh
npm run -s quality:summary -- <RUN_ID>
```

Replace the verdict placeholder at the top of `quality-reports/<RUN_ID>/summary.md` (never hand-edit the generated tables). One of **Ready / Ready with known risk / Not ready / Insufficient evidence**, then: confidence and what it rests on, blocking findings, what changed since the previous run (fixed, new, still open), gaps, the reconciliation table, and hygiene. Passing tests alone are never a verdict.

## 6. Rebuild and verify the report

Re-rate capabilities in `quality-model.json` only where this run changed what is known, and cite the run in `confidenceWhy`. Then:

```sh
node ~/.claude/skills/quality-intelligence-report/scripts/build-quality-report.js --project .
node ~/.claude/skills/quality-intelligence-report/scripts/verify-quality-report.js --project . --modules <dir>
```

The verifier needs `@playwright/test` and `@axe-core/playwright`. If they aren't resolvable, install them into a scratch folder (`npm i @playwright/test@<project version> @axe-core/playwright`) and pass it as `--modules`; don't add them to the project. Read the builder's integrity notes to the user — an unresolved reference or an unowned dimension is a finding about the testing.

## 7. Report to the user

Terse: verdict and confidence, what changed since the previous run, blocking findings, gaps, integrity notes, and where the files are. Don't commit unless asked; if asked, the PII hook blocks credential-shaped strings (`password":"…"` with 8+ characters) even in evidence, so check `git diff --cached` for them first.
