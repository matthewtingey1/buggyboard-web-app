Set up a quality agent team for this project, then run it.

**Project:** buggyboard-web-app — `~/DEV/IdeaProjects/buggyboard-web-app`
**What it is:** BuggyBoard, a small bug-tracker web app (React + Express + SQLite) used as a Playwright test target: log in, then create, search, sort, edit, close and delete bugs on a board
**Test command:** `npx playwright test` (playwright)
**Authority documents:** specs/features/*.md (Gherkin acceptance criteria per feature), specs/product/vision.md, specs/design/theme.md, specs/engineering/api-conventions.md
**Candidate / baseline:** the working tree against origin/main

Use the `quality-agent-team` skill. Work from the project root and read the repository before
you write anything.

## Phase 1 — audit and assemble

Start by finding where any existing agents and skills actually live. If they are anywhere other
than `.claude/agents/` and `.claude/skills/`, nothing loads them — relocate them and tell me I
need to restart from the project directory.

Then confirm the dimensions below against what the product actually does. If the code does not
justify one, say so and drop it rather than writing an agent with nothing to own. If you find a
surface none of them covers, name it.

Write one agent per line below, and give each exactly one owner:

- **Functional** — `functional-agent` (slug `functional`). Owns the behaviour the product exists for — inputs, computation, results, state transitions. Judge it against the functional requirements and the documented test cases.
- **Accessibility** — `a11y-auditor` (slug `a11y`). Owns the whole journey against WCAG 2.2 AA — keyboard, names and roles, announcements, contrast, reflow. Judge it against the accessibility requirements.
- **Security** — `security-agent` (slug `security`). Owns hostile input, the sinks it can reach, storage and network silence, dependencies, resource limits. Judge it against the security requirements.
- **API contract** — `api-contract-agent` (slug `contract`). Owns status codes, response shapes, error bodies, and the difference between a contract break and a business rule. Judge it against the API specification.
- **Authorization** — `authorization-agent` (slug `authz`). Owns who may read and write what, and what a caller without the role actually receives. Judge it against the permissions model.
- **Data integrity** — `data-integrity-agent` (slug `data`). Owns persistence, migrations, and whether a written record reads back the way it was written. Judge it against the data model and its constraints.
- **Exploratory** — `exploratory-agent` (slug `exploratory`). Owns the paths no specification names, chartered by risk rather than by requirement. Judge it against the product itself; findings carry their own charter.


Each agent file needs `name`, `description`, `tools` and `model` frontmatter, `name` matching the
filename, and `Write` in `tools`. Write each one as a contract: the authority document it tests
against, its inputs in reading order, its method, the evidence classes it must produce, and its
stopping conditions. Make each one state what it cannot establish on this machine.

Install the run contract from the skill's `references/report-contract.md`, with the slug table
matching this roster.

Stop here and show me the roster before going further.

## Phase 2 — run it

Open a run, run the full suite yourself once as the lead, then dispatch every specialist in a
single message so they run concurrently. Give each the same `RUN_ID`, the candidate, the baseline
and the part of the diff that concerns it.

Hold them to this, or they will collide:
- `--workers=1` on every scoped run. Concurrent agents at default parallelism produce timeouts
  that read exactly like product defects.
- Scoped output into their own evidence folder. Only you run the full suite.
- Their own findings file. Never a shared one.

Then reconcile: fold duplicate findings, resolve conflicting fixes and name who owns the call,
state apparent contradictions as one observation with two readings, and treat a missing report as
a gap rather than a pass. Merge with `quality-summary.js` and write the verdict yourself.

## Phase 3 — report

Use the `quality-intelligence-report` skill. Author `quality-model.json` from what the repository
actually contains, set `meta.automation.kind` to `playwright`, build the report and run
the verifier. Read the integrity notes aloud to me — an unresolved evidence reference and an
unowned dimension are both findings about the testing.

## Rules for all three phases

- Do not invent evidence, results, coverage, defects or dates. Where evidence does not exist,
  show the gap; that is the point of the exercise.
- Coverage and defects are tracked separately. A gap is something nobody looked at, not something
  known to be broken.
- Measured once by hand is `weak`, not `strong` — say which claims nothing guards.
- Do not fix application code unless I ask. Report findings.
