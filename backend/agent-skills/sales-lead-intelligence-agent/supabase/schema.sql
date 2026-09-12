-- Sigma Tactix AI Lead Intelligence Agent v0.1 (Lean MVP)
-- Supabase Schema: Leads, Messages, Appointments & Pipeline Analytics View

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    full_name TEXT,
    email TEXT,
    phone TEXT NOT NULL,
    company TEXT,
    source TEXT DEFAULT 'website_form', -- 'website_form', 'whatsapp', 'manual', 'ad_campaign'
    
    -- AI Scoring & Rubric
    score INTEGER CHECK (score >= 0 AND score <= 100),
    tier TEXT CHECK (tier IN ('hot', 'warm', 'cold')),
    need_summary TEXT,
    budget_range TEXT,
    timeline TEXT,
    authority TEXT,
    disqualified BOOLEAN DEFAULT FALSE,
    
    -- Status & Lifecycle
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'qualifying', 'qualified', 'nurture', 'disqualified', 'converted')),
    followup_step INTEGER NOT NULL DEFAULT 0,
    next_followup_at TIMESTAMPTZ,
    last_contact_at TIMESTAMPTZ,
    
    -- AI Outputs & Notes
    reply_draft TEXT,
    internal_note TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for high-throughput scheduler and intake lookup
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_tier ON public.leads(tier);
CREATE INDEX IF NOT EXISTS idx_leads_followup ON public.leads(next_followup_at, status);

-- 3. LEAD MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.lead_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'email', 'sms', 'form')),
    body TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT FALSE,
    twilio_message_sid TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_lead_messages_lead_id ON public.lead_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_messages_created_at ON public.lead_messages(created_at);

-- 4. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'canceled', 'no_show')),
    cal_booking_id TEXT,
    booking_url TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON public.appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON public.appointments(starts_at);

-- 5. PIPELINE ANALYTICS VIEW
CREATE OR REPLACE VIEW public.v_lead_pipeline AS
SELECT 
    l.id AS lead_id,
    l.full_name,
    l.phone,
    l.email,
    l.company,
    l.score,
    l.tier,
    l.status,
    l.followup_step,
    l.next_followup_at,
    l.last_contact_at,
    l.created_at AS lead_created_at,
    l.need_summary,
    l.budget_range,
    l.timeline,
    l.authority,
    COUNT(DISTINCT m.id) AS total_messages,
    COUNT(DISTINCT CASE WHEN m.direction = 'inbound' THEN m.id END) AS inbound_messages,
    COUNT(DISTINCT CASE WHEN m.direction = 'outbound' THEN m.id END) AS outbound_messages,
    MAX(a.starts_at) AS next_appointment_at,
    MAX(a.status) AS appointment_status
FROM public.leads l
LEFT JOIN public.lead_messages m ON m.lead_id = l.id
LEFT JOIN public.appointments a ON a.lead_id = l.id
GROUP BY l.id;

-- 6. AUTO-UPDATE UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
