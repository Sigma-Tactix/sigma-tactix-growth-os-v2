# Fast bounded decisions with Laya

Use the project Laya command when a development choice has two or more concrete,
allowlisted options and a quick advisory signal would reduce delay:

```bash
npm run laya:decide -- \
  --question "Which implementation path best fits the current architecture?" \
  --context "Include verified constraints and relevant test evidence only." \
  --option "repair=Repair the existing shared path" \
  --option "rebuild=Create a separate implementation"
```

Treat the JSON result as advisory evidence. Antigravity remains responsible for
checking source code, tests, user instructions, and project rules. Laya never
authorizes writes, spending, publication, deployment, deletion, or bypassing a
human approval gate. If the command returns exit code 2 or `engine: unavailable`,
continue with verified evidence and state that Laya made no recommendation.
