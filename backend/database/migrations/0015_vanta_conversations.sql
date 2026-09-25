-- VANTA command-brain persistence. Private by default, explicitly shareable,
-- and isolated by workspace membership plus conversation ownership.

CREATE TABLE IF NOT EXISTS vanta_settings (
    workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
    text_provider text NOT NULL DEFAULT 'gemini',
    text_model text,
    voice_provider text NOT NULL DEFAULT 'gemini',
    voice_config jsonb NOT NULL DEFAULT '{}'::jsonb,
    provider_verified_at timestamptz,
    voice_verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vanta_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by uuid NOT NULL DEFAULT auth.uid(),
    title text NOT NULL DEFAULT 'New VANTA conversation',
    visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'workspace')),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vanta_conversations_owner ON vanta_conversations(workspace_id, created_by, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_vanta_conversations_expiry ON vanta_conversations(expires_at);

CREATE TABLE IF NOT EXISTS vanta_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    conversation_id uuid NOT NULL REFERENCES vanta_conversations(id) ON DELETE CASCADE,
    created_by uuid NOT NULL DEFAULT auth.uid(),
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
    proposal jsonb,
    memory_suggestion text,
    provider text,
    model text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vanta_messages_conversation ON vanta_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS vanta_memories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by uuid NOT NULL DEFAULT auth.uid(),
    source_message_id uuid REFERENCES vanta_messages(id) ON DELETE SET NULL,
    content text NOT NULL,
    visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'workspace')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vanta_memories_owner ON vanta_memories(workspace_id, created_by, updated_at DESC);

ALTER TABLE vanta_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vanta_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vanta_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vanta_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vanta_settings_read_member ON vanta_settings;
CREATE POLICY vanta_settings_read_member ON vanta_settings FOR SELECT TO authenticated
    USING (public.is_member(workspace_id));
DROP POLICY IF EXISTS vanta_settings_admin_write ON vanta_settings;
CREATE POLICY vanta_settings_admin_write ON vanta_settings FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM workspace_members m
      WHERE m.workspace_id = vanta_settings.workspace_id
        AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM workspace_members m
      WHERE m.workspace_id = vanta_settings.workspace_id
        AND m.user_id = auth.uid() AND m.role IN ('owner', 'admin')
    ));

DROP POLICY IF EXISTS vanta_conversations_read ON vanta_conversations;
CREATE POLICY vanta_conversations_read ON vanta_conversations FOR SELECT TO authenticated
    USING (public.is_member(workspace_id) AND (created_by = auth.uid() OR visibility = 'workspace'));
DROP POLICY IF EXISTS vanta_conversations_insert ON vanta_conversations;
CREATE POLICY vanta_conversations_insert ON vanta_conversations FOR INSERT TO authenticated
    WITH CHECK (public.is_member(workspace_id) AND created_by = auth.uid());
DROP POLICY IF EXISTS vanta_conversations_update_own ON vanta_conversations;
CREATE POLICY vanta_conversations_update_own ON vanta_conversations FOR UPDATE TO authenticated
    USING (public.is_member(workspace_id) AND created_by = auth.uid())
    WITH CHECK (public.is_member(workspace_id) AND created_by = auth.uid());
DROP POLICY IF EXISTS vanta_conversations_delete_own ON vanta_conversations;
CREATE POLICY vanta_conversations_delete_own ON vanta_conversations FOR DELETE TO authenticated
    USING (public.is_member(workspace_id) AND created_by = auth.uid());

DROP POLICY IF EXISTS vanta_messages_read ON vanta_messages;
CREATE POLICY vanta_messages_read ON vanta_messages FOR SELECT TO authenticated
    USING (public.is_member(workspace_id) AND EXISTS (
      SELECT 1 FROM vanta_conversations c
      WHERE c.id = conversation_id AND c.workspace_id = vanta_messages.workspace_id
        AND (c.created_by = auth.uid() OR c.visibility = 'workspace')
    ));
DROP POLICY IF EXISTS vanta_messages_insert_own_conversation ON vanta_messages;
CREATE POLICY vanta_messages_insert_own_conversation ON vanta_messages FOR INSERT TO authenticated
    WITH CHECK (public.is_member(workspace_id) AND created_by = auth.uid() AND EXISTS (
      SELECT 1 FROM vanta_conversations c
      WHERE c.id = conversation_id AND c.workspace_id = vanta_messages.workspace_id
        AND c.created_by = auth.uid()
    ));
DROP POLICY IF EXISTS vanta_messages_delete_own ON vanta_messages;
CREATE POLICY vanta_messages_delete_own ON vanta_messages FOR DELETE TO authenticated
    USING (created_by = auth.uid() AND public.is_member(workspace_id));

DROP POLICY IF EXISTS vanta_memories_read ON vanta_memories;
CREATE POLICY vanta_memories_read ON vanta_memories FOR SELECT TO authenticated
    USING (public.is_member(workspace_id) AND (created_by = auth.uid() OR visibility = 'workspace'));
DROP POLICY IF EXISTS vanta_memories_insert ON vanta_memories;
CREATE POLICY vanta_memories_insert ON vanta_memories FOR INSERT TO authenticated
    WITH CHECK (public.is_member(workspace_id) AND created_by = auth.uid());
DROP POLICY IF EXISTS vanta_memories_update_own ON vanta_memories;
CREATE POLICY vanta_memories_update_own ON vanta_memories FOR UPDATE TO authenticated
    USING (created_by = auth.uid() AND public.is_member(workspace_id))
    WITH CHECK (created_by = auth.uid() AND public.is_member(workspace_id));
DROP POLICY IF EXISTS vanta_memories_delete_own ON vanta_memories;
CREATE POLICY vanta_memories_delete_own ON vanta_memories FOR DELETE TO authenticated
    USING (created_by = auth.uid() AND public.is_member(workspace_id));

REVOKE ALL ON vanta_settings, vanta_conversations, vanta_messages, vanta_memories FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON vanta_settings, vanta_conversations, vanta_messages, vanta_memories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vanta_settings, vanta_conversations, vanta_messages, vanta_memories TO service_role;

CREATE OR REPLACE FUNCTION public.purge_expired_vanta_conversations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE deleted_count integer;
BEGIN
  DELETE FROM vanta_conversations WHERE expires_at <= now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.purge_expired_vanta_conversations() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_vanta_conversations() TO service_role;
