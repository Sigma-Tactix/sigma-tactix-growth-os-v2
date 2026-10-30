-- Apply only to the explicitly selected database. Provider setup is separate.
BEGIN;
CREATE TABLE IF NOT EXISTS public.mcp_tool_calls (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  server_id text NOT NULL CHECK (server_id = 'google-ads'),
  tool_name text NOT NULL CHECK (tool_name IN ('customers_list_accessible_customers', 'metadata_get_resource_metadata', 'search_search')),
  status text NOT NULL CHECK (status IN ('started', 'succeeded', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  result jsonb,
  CHECK ((status = 'started' AND finished_at IS NULL) OR (status <> 'started' AND finished_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS mcp_tool_calls_workspace_time ON public.mcp_tool_calls(workspace_id, started_at DESC);
ALTER TABLE public.mcp_tool_calls ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.mcp_tool_calls TO authenticated;
REVOKE ALL ON public.mcp_tool_calls FROM anon;
CREATE POLICY mcp_calls_read ON public.mcp_tool_calls FOR SELECT TO authenticated
  USING (public.is_member(workspace_id));
CREATE POLICY mcp_calls_start ON public.mcp_tool_calls FOR INSERT TO authenticated
  WITH CHECK (public.is_member(workspace_id) AND actor_id = auth.uid() AND status = 'started' AND result IS NULL);
CREATE POLICY mcp_calls_finish ON public.mcp_tool_calls FOR UPDATE TO authenticated
  USING (public.is_member(workspace_id) AND actor_id = auth.uid() AND status = 'started')
  WITH CHECK (public.is_member(workspace_id) AND actor_id = auth.uid() AND status IN ('succeeded', 'failed'));
COMMENT ON TABLE public.mcp_tool_calls IS 'Workspace-scoped execution receipts, not authorization grants or independently attested provider evidence.';
COMMIT;
