# Local sprint board

`sprint_board.py` is a Python-standard-library SQLite coordinator. It does not launch models, execute shell commands, merge Git branches, deploy, authenticate workers or grant tool permissions. Worker names and roles are coordination labels. The actual IDE coordinator must inspect evidence and enforce access.

Tested with:

```bash
python3 -m unittest discover -s tools -p test_sprint_board.py -v
```

Result at creation: 9 tests passed. Tests cover concurrent exclusive claims, dependencies, resource locks, expiry/reconciliation, independent review, failure limits and evidence confinement.

## Task input

Use an array or an object containing `tasks`. Unknown extra fields are ignored, so the main task board can also include narrative acceptance criteria. `depends_on`, `dependencies` and `deps` are accepted dependency names. Every task needs a nonempty role. IDs must be unique and dependencies must form a valid DAG.

```json
{
  "tasks": [
    {"id":"S01","role":"research","depends_on":[],"resources":[]},
    {"id":"S02","role":"integrator","depends_on":["S01"],"resources":["shared-contracts"]}
  ]
}
```

Resource names are opaque, exact-match keys. Every task touching the same shared file/service must declare the same key. The board does not discover file ownership, detect path prefixes or protect undeclared files.

## Commands

From the release kit directory, replacing `/path/to/repo` with the current product checkout:

```bash
python3 tools/sprint_board.py --db sprint.sqlite init tasks.json --repo /path/to/repo
python3 tools/sprint_board.py --db sprint.sqlite ready --role research
python3 tools/sprint_board.py --db sprint.sqlite claim --worker research-1 --role research
python3 tools/sprint_board.py --db sprint.sqlite status
python3 tools/sprint_board.py --db sprint.sqlite heartbeat S01 --worker research-1
```

`claim` can include `--task S01` and `--lease-minutes 30`. A worker may own only one actively claimed task. No available task returns JSON `null`; it does not mean that all tasks are complete.

Once work is committed and acceptance evidence is written **inside the configured repository**, submit with the full lowercase Git SHA:

```bash
python3 tools/sprint_board.py --db sprint.sqlite submit S01 --worker research-1 --commit FULL_40_CHARACTER_SHA --evidence evidence/S01/report.md
python3 tools/sprint_board.py --db sprint.sqlite review S01 --worker reviewer-1 --result pass --note 'Checked acceptance and limitations'
python3 tools/sprint_board.py --db sprint.sqlite integrate S01 --worker lead --role integrator --receipt evidence/S01/verify.json
```

Verification receipt format:

```json
{
  "commit":"FULL_40_CHARACTER_SHA",
  "command":"npm run verify",
  "exit_code":0,
  "evidence":["evidence/S01/verify.log"]
}
```

The receipt commit must exactly match the submitted commit; the logs must exist inside the repository. This is a consistency check on supplied evidence, not independent proof that a command ran. The reviewer/integrator remains responsible for authenticity and for rerunning verification on the final integrated Git tree. A merge commit or cherry-pick creating a different SHA needs its own release verification outside this task-level receipt.

Dependencies unlock only when prerequisite tasks reach `integrated`, not merely submitted or reviewed. Shared resources remain locked through claim, submission and review. Successful integration or a failed review releases the locks.

## Expiry and failure handling

Heartbeats renew active claims for 30 minutes. An expired claim becomes `blocked` with `lease_expired` and retains locks. It is never automatically reassigned. After confirming the old worker has stopped and inspecting its branch/worktree, the integrator records reconciliation:

```bash
python3 tools/sprint_board.py --db sprint.sqlite reconcile S01 --worker lead --role integrator --resolution retry --note 'Worker stopped; branch and worktree inspected'
```

Use `--resolution cancel` to cancel instead. Cancelled prerequisites keep dependent work blocked. A rejected review or an expiry reconciled for retry counts as a failed attempt. Two failures escalate the task and prevent further claims. Escalated work requires an explicit human/coordinator replan; this utility deliberately provides no force-reset shortcut. Review failure needs a note and must come from a different worker name than the author.

SQLite records state transitions in its `events` table. Keep the board on a local reliable filesystem shared by the coordinator processes. It is not a distributed scheduler and should not be placed on an unreliable network share. Store the database outside the product repository or ignore it; preserve it as operational state. Stop workers before moving its database.
