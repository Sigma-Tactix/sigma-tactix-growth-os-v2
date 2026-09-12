-- SQL Migration Script: Sigma Tactix Growth OS Relational Second Brain
-- Target Database: PostgreSQL (with pgvector support)
-- Deploys 10 secure, partitioned vaults and HITL logs.

-- Create schemas to group vaults for access controls
CREATE SCHEMA IF NOT EXISTS executive_zone;
CREATE SCHEMA IF NOT EXISTS storage_zone;
CREATE SCHEMA IF NOT EXISTS creative_zone;
CREATE SCHEMA IF NOT EXISTS ops_zone;

-- Enable uuid and vector extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "vector"; -- Enable if pgvector is installed in server instance

-- Enums Definition
CREATE TYPE credential_category_enum AS ENUM ('Website', 'Social', 'CRM', 'Analytics', 'Ads', 'Email');
CREATE TYPE credential_status_enum AS ENUM ('Connected', 'Disconnected', 'Needs Re-auth');
CREATE TYPE agent_type_enum AS ENUM ('Marketing Agent', 'AI SDR (Sales Agent)', 'Customer Success Agent', 'Operations Agent');
CREATE TYPE task_status_enum AS ENUM ('Pending Approval', 'Approved', 'Rejected', 'Running', 'Success', 'Failed');

-- Global System Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_email VARCHAR(150),
    action VARCHAR(100) NOT NULL,
    target_vault VARCHAR(50) NOT NULL,
    details VARCHAR(500)
);

-- 1. Executive Vault
CREATE TABLE IF NOT EXISTS executive_vault (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL UNIQUE,
    financials_overview TEXT,
    strategic_plans TEXT,
    intellectual_property TEXT,
    c_level_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Credentials Vault
CREATE TABLE IF NOT EXISTS credentials_vault (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(100) NOT NULL,
    username VARCHAR(150) NOT NULL,
    encrypted_access_token VARCHAR(500) NOT NULL,
    encrypted_refresh_token VARCHAR(500),
    scopes JSONB,
    status credential_status_enum DEFAULT 'Connected',
    category credential_category_enum NOT NULL,
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Brand Vault
CREATE TABLE IF NOT EXISTS brand_vault (
    id SERIAL PRIMARY KEY,
    voice_and_tone TEXT NOT NULL,
    core_positioning TEXT NOT NULL,
    offers_and_pricing JSONB NOT NULL,
    brand_slogan VARCHAR(250),
    key_messages JSONB,
    voice_embedding JSONB, -- Fallback to JSONB or vector type if vector is enabled: voice_embedding vector(1536)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Customer Vault
CREATE TABLE IF NOT EXISTS customer_vault (
    id SERIAL PRIMARY KEY,
    ideal_customer_profile TEXT NOT NULL,
    target_segments JSONB NOT NULL,
    customer_objections JSONB,
    testimonials JSONB,
    persona_embeddings JSONB -- persona_embeddings vector(1536)
);

-- 5. Marketing Vault
CREATE TABLE IF NOT EXISTS marketing_vault (
    id SERIAL PRIMARY KEY,
    campaign_history TEXT,
    current_channels JSONB NOT NULL,
    recent_performance TEXT,
    content_calendar_schedule JSONB,
    campaign_metrics JSONB
);

-- 6. Website Vault
CREATE TABLE IF NOT EXISTS website_vault (
    id SERIAL PRIMARY KEY,
    site_url VARCHAR(250) NOT NULL UNIQUE,
    cms_type VARCHAR(100) DEFAULT 'WordPress',
    analytics_id VARCHAR(100),
    page_history JSONB,
    structural_ux_records JSONB
);

-- 7. Authority Vault
CREATE TABLE IF NOT EXISTS authority_vault (
    id SERIAL PRIMARY KEY,
    target_keywords JSONB NOT NULL,
    backlink_profile_summary TEXT,
    seo_focus_areas JSONB,
    ai_visibility_scores JSONB
);

-- 8. Operations Vault
CREATE TABLE IF NOT EXISTS operations_vault (
    id SERIAL PRIMARY KEY,
    org_hierarchy TEXT,
    sops_list JSONB NOT NULL,
    roles_permissions_matrix JSONB
);

-- 9. AI Workflow Vault
CREATE TABLE IF NOT EXISTS ai_workflow_vault (
    id SERIAL PRIMARY KEY,
    agent_type agent_type_enum NOT NULL UNIQUE,
    system_prompt TEXT NOT NULL,
    model_router_endpoint VARCHAR(250) DEFAULT 'gemini-3.5-flash',
    temperature FLOAT DEFAULT 0.2,
    max_tokens INTEGER DEFAULT 2048,
    agent_constraints JSONB NOT NULL,
    workflow_logs JSONB
);

-- 10. Audit Vault
CREATE TABLE IF NOT EXISTS audit_vault (
    id SERIAL PRIMARY KEY,
    overall_score INTEGER DEFAULT 50,
    growth_diagnostics JSONB NOT NULL,
    uiux_checklists JSONB,
    roadmap_90day JSONB NOT NULL,
    completed_roadmap_milestones JSONB,
    last_audited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Human-In-The-Loop (HITL) Queue & Execution Ledger
CREATE TABLE IF NOT EXISTS agent_task_approvals (
    id VARCHAR(100) PRIMARY KEY,
    agent_name agent_type_enum NOT NULL,
    goal TEXT NOT NULL,
    status task_status_enum DEFAULT 'Pending Approval',
    steps JSONB NOT NULL,
    output TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(150),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason VARCHAR(250)
);

-- Insert Seed configurations into AI Workflow Vault for standard security rules
INSERT INTO ai_workflow_vault (agent_type, system_prompt, agent_constraints)
VALUES 
('Marketing Agent', 'You are the Growth OS Marketing Agent. Draft highly effective creative assets and schedule campaigns based ONLY on the Brand and Customer Vaults.', '["Cannot query ExecutiveVault", "Cannot read raw api credentials from CredentialsVault", "All generated draft contents must go through the Human-In-The-Loop review queue before publishing"]'),
('AI SDR (Sales Agent)', 'You are the Growth OS outreach representative. Compose targeted LinkedIn messaging and outbound lead logs.', '["Strictly sandboxed access - no Executive Vault or Operations Vault rights", "No direct external API writing without a valid approval token"]'),
('Operations Agent', 'You are the Operations Agent. Refine internal procedures and model efficiency metrics.', '["Cannot modify credentials or financial sheets", "Read operations logs only"]')
ON CONFLICT (agent_type) DO NOTHING;

-- Create security views representing RBAC limits for sandboxed database roles
CREATE OR REPLACE VIEW marketing_agent_view AS
SELECT bv.voice_and_tone, bv.core_positioning, cv.ideal_customer_profile, mv.content_calendar_schedule, av.target_keywords
FROM brand_vault bv, customer_vault cv, marketing_vault mv, authority_vault av;

CREATE OR REPLACE VIEW sales_sdr_agent_view AS
SELECT bv.core_positioning, bv.brand_slogan, cv.ideal_customer_profile, cv.customer_objections
FROM brand_vault bv, customer_vault cv;
