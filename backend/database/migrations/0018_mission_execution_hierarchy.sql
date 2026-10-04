-- 0018_mission_execution_hierarchy: durable mission and sub-agent lineage.
-- Keeps the 0017 ledger as the source of lifecycle truth while allowing a
-- mission to be reconstructed from one plan and its parent/child runs.
ALTER TABLE ledger_runs
  ADD COLUMN IF NOT EXISTS mission_id text,
  ADD COLUMN IF NOT EXISTS plan_id text,
  ADD COLUMN IF NOT EXISTS sub_agent text,
  ADD COLUMN IF NOT EXISTS parent_run_id uuid REFERENCES ledger_runs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_ledger_runs_mission ON ledger_runs(workspace_id, mission_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_runs_parent ON ledger_runs(parent_run_id);
CREATE INDEX IF NOT EXISTS idx_ledger_runs_plan ON ledger_runs(workspace_id, plan_id);
