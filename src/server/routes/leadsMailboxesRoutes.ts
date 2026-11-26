import { Router, type Request, type Response } from 'express';

// ---------------------------------------------------------------------------
// Native Sovereign Lead pipeline + public conversion dock + agent mailboxes &
// branded outreach dispatch. Pure in-memory demo state (the SEED_DEMO_WORKSPACE
// switch controls the seed data; fabricated prospects never ship as live
// pipeline) served over public + /api/workspace twin registrations.
//
// Extracted from server.ts (P2 increment 19 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). The three region-local state vars
// (inMemorySovereignLeads, inMemoryAgentMailboxes, inMemoryBrandEmailTheme)
// co-move verbatim with their 8 registrations — they have zero out-of-region
// references, so the factory stays zero-arg. Handler bodies byte-preserved.
// The multi-path /api/admin/... + /api/workspace/... registrations are kept
// exactly as inline; their auth posture (public /api/admin twin registered
// BEFORE the workspace requireAuth mount) is carried by the mount position,
// which sits at the ORIGINAL location: before app.use("/api", apiLimiter)
// and app.use("/api/workspace", requireAuth).
// ---------------------------------------------------------------------------

export function createLeadsMailboxesRouter(): Router {
  const router = Router();

// ============================================================================
// NATIVE SOVEREIGN LEAD PIPELINE & PUBLIC CONVERSION DOCK API
// Solves the "No CRM" bottleneck natively with zero 3rd-party dependencies
// ============================================================================
interface SovereignLead {
  id: string;
  name: string;
  email: string;
  company: string;
  domain?: string;
  title?: string;
  linkedinUrl?: string;
  stage: 'NEW_INBOUND' | 'ENRICHED' | 'OUTREACH_QUEUED' | 'REPLIED_WARM' | 'CALL_BOOKED' | 'CLOSED_WON';
  sourceVector: string;
  estimatedArr?: string;
  /**
   * ICP score is only present when a real scoring/enrichment source produced
   * it. Leads entered manually or captured inbound start "unscored" — a
   * random number here would read as fact in the pipeline KPIs.
   */
  icpScore?: number;
  notes?: string;
  capturedAt: string;
}

// The sovereign pipeline starts EMPTY for a fresh workspace. The five demo
// leads below are reachable ONLY behind SEED_DEMO_WORKSPACE=true (the same
// server switch that seeds the demo Second Brain) — fabricated prospects
// never ship as live pipeline data.
const inMemorySovereignLeads: SovereignLead[] =
  process.env.SEED_DEMO_WORKSPACE === "true"
    ? [
      {
        id: 'lead-101',
        name: 'Sarah Chen',
        email: 'sarah@hyperdrive.ai',
        company: 'HyperDrive AI',
        domain: 'hyperdrive.ai',
        title: 'Head of Growth',
        linkedinUrl: 'https://linkedin.com/in/sarahchen-growth',
        stage: 'REPLIED_WARM',
        sourceVector: 'Cold SDR (Mercury-07)',
        estimatedArr: '$4.2M',
        icpScore: 94,
        notes: 'Replied asking about our 90-day ROI guarantee. Wants diagnostic audit run on their signup funnel.',
        capturedAt: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'lead-102',
        name: 'Marcus Vance',
        email: 'marcus@omnicore.io',
        company: 'OmniCore Software',
        domain: 'omnicore.io',
        title: 'Founder & CEO',
        linkedinUrl: 'https://linkedin.com/in/marcusvance',
        stage: 'CALL_BOOKED',
        sourceVector: 'Conversion Dock (Embed)',
        estimatedArr: '$8.5M',
        icpScore: 98,
        notes: 'Booked diagnostic teardown call for Thursday 2 PM. High priority B2B enterprise SaaS.',
        capturedAt: new Date(Date.now() - 3600000 * 18).toISOString()
      },
      {
        id: 'lead-103',
        name: 'David Reynolds',
        email: 'david@strataflow.com',
        company: 'StrataFlow Systems',
        domain: 'strataflow.com',
        title: 'VP Marketing',
        stage: 'OUTREACH_QUEUED',
        sourceVector: 'Performance Ads (Google RSA)',
        estimatedArr: '$2.8M',
        icpScore: 88,
        notes: 'Clicked Google RSA ad on /growth-os keyword. Verified domain speed leak (FCP 3.1s).',
        capturedAt: new Date(Date.now() - 3600000 * 28).toISOString()
      },
      {
        id: 'lead-104',
        name: 'Elena Rostova',
        email: 'elena@novapulse.tech',
        company: 'NovaPulse Technologies',
        domain: 'novapulse.tech',
        title: 'Chief Revenue Officer',
        stage: 'CLOSED_WON',
        sourceVector: 'SEO & AEO Authority',
        estimatedArr: '$12.0M',
        icpScore: 96,
        notes: 'Signed $5,000/mo retainer. Onboarded into Sovereign Enclave with full Second Brain ingestion.',
        capturedAt: new Date(Date.now() - 3600000 * 72).toISOString()
      },
      {
        id: 'lead-105',
        name: 'Jordan Miller',
        email: 'jordan@finscale.co',
        company: 'FinScale Protocol',
        domain: 'finscale.co',
        title: 'Growth Director',
        stage: 'ENRICHED',
        sourceVector: 'Apollo ICP Scraper',
        estimatedArr: '$3.5M',
        icpScore: 91,
        notes: 'Enriched verified email and mobile tech stack. Elementor site with 0 JSON-LD schemas detected.',
        capturedAt: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ]
    : [];

// Public Capture Lead API for Embeddable Conversion Dock (No auth needed)
router.post('/api/public/capture-lead', async (req: Request, res: Response) => {
  const { name, email, company, domain, phone, sourceVector, needs, notes } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: "Contact name is required." });
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: "Valid work email address is required." });
    return;
  }

  const newLead: SovereignLead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    company: (company || domain || "Unspecified Org").trim(),
    domain: domain ? domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim() : undefined,
    stage: 'NEW_INBOUND',
    sourceVector: sourceVector || 'Conversion Dock (Embed)',
    // No ARR band or ICP score is invented on capture: the lead is unscored
    // until a real enrichment source produces one.
    notes: notes || needs || 'Captured via public Conversion Dock widget.',
    capturedAt: new Date().toISOString()
  };

  inMemorySovereignLeads.unshift(newLead);

  res.json({
    success: true,
    leadId: newLead.id,
    lead: newLead,
    message: "Lead successfully committed into Sovereign CRM pipeline. Zero third-party CRM required."
  });
});

// Sovereign Leads REST Endpoints
router.get(['/api/leads', '/api/workspace/leads'], async (req: Request, res: Response) => {
  res.json({
    success: true,
    leads: inMemorySovereignLeads,
    totalCount: inMemorySovereignLeads.length,
    pipelineValue: inMemorySovereignLeads.reduce((acc, l) => {
      const val = parseFloat(String(l.estimatedArr || '0').replace(/[^0-9.]/g, ''));
      return acc + (isNaN(val) ? 0 : val);
    }, 0)
  });
});

router.post(['/api/leads/create', '/api/workspace/leads/create'], async (req: Request, res: Response) => {
  const { name, email, company, domain, title, linkedinUrl, stage, sourceVector, estimatedArr, icpScore, notes } = req.body;
  if (!name || !name.trim() || !email || !email.trim()) {
    res.status(400).json({ error: "Name and email are mandatory." });
    return;
  }

  const createdLead: SovereignLead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    company: (company || "Private Entity").trim(),
    domain: domain?.trim(),
    title: title?.trim(),
    linkedinUrl: linkedinUrl?.trim(),
    stage: stage || 'NEW_INBOUND',
    sourceVector: sourceVector || 'Manual Entry',
    estimatedArr: estimatedArr || undefined,
    // ICP score is only recorded when a caller supplies a real one; a
    // fabricated random number would otherwise badge as fact in the UI.
    icpScore: typeof icpScore === 'number' && Number.isFinite(icpScore)
      ? Math.max(0, Math.min(100, Math.round(icpScore)))
      : undefined,
    notes: notes?.trim(),
    capturedAt: new Date().toISOString()
  };

  inMemorySovereignLeads.unshift(createdLead);
  res.json({ success: true, lead: createdLead });
});

router.post(['/api/leads/update-stage', '/api/workspace/leads/update-stage'], async (req: Request, res: Response) => {
  const { id, stage } = req.body;
  const lead = inMemorySovereignLeads.find(l => l.id === id);
  if (!lead) {
    res.status(404).json({ error: "Lead not found." });
    return;
  }
  lead.stage = stage;
  res.json({ success: true, lead, message: `Lead ${id} moved to stage ${stage}.` });
});

// Agent Mailboxes & Branded Outreach Dispatch Endpoints
let inMemoryAgentMailboxes = [
  {
    agentId: 'agent-outreach',
    codename: 'HERMES-07',
    assignedEmail: 'sdr@sigmatactix.com',
    senderDisplayName: 'Liam Sterling | Sovereign SDR',
    senderTitle: 'B2B Growth Specialist & Revenue Architect',
    transportType: 'SMTP',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    dailySendLimit: 45,
    currentSentToday: 18,
    status: 'ACTIVE',
    deliverabilityScore: 99.4
  },
  {
    agentId: 'agent-orchestrator',
    codename: 'CHRONOS-00',
    assignedEmail: 'orchestrator@sigmatactix.com',
    senderDisplayName: 'Sigma Tactix Growth Operations',
    senderTitle: 'Autonomous Enterprise Architecture Supervisor',
    transportType: 'RESEND',
    dailySendLimit: 100,
    currentSentToday: 32,
    status: 'ACTIVE',
    deliverabilityScore: 99.8
  }
];

let inMemoryBrandEmailTheme = {
  companyName: 'Sigma Tactix',
  companyDomain: 'sigmatactix.com',
  primaryAccentColor: '#F59E0B',
  supportEmail: 'advisory@sigmatactix.com'
};

router.get(['/api/admin/agent-mailboxes', '/api/workspace/agent-mailboxes'], async (req: Request, res: Response) => {
  res.json({
    success: true,
    mailboxes: inMemoryAgentMailboxes,
    theme: inMemoryBrandEmailTheme
  });
});

router.post(['/api/admin/agent-mailboxes/save', '/api/workspace/agent-mailboxes/save'], async (req: Request, res: Response) => {
  const { mailboxes, theme } = req.body;
  if (mailboxes && Array.isArray(mailboxes)) {
    inMemoryAgentMailboxes = mailboxes;
  }
  if (theme) {
    inMemoryBrandEmailTheme = { ...inMemoryBrandEmailTheme, ...theme };
  }
  res.json({ success: true, message: "Agent mailbox configurations updated successfully." });
});

router.post(['/api/admin/agent-mailboxes/test-send', '/api/workspace/agent-mailboxes/test-send'], async (req: Request, res: Response) => {
  const { recipient, assignedEmail, senderDisplayName, transportType } = req.body;
  if (!recipient || !recipient.includes('@')) {
    res.status(400).json({ error: "Valid recipient email is required." });
    return;
  }

  // Simulated handshake verification (SPF/DKIM handshake log)
  console.log(`[MAILBOX] Test handshake dispatched from ${assignedEmail} (${senderDisplayName}) to ${recipient} via ${transportType}`);
  res.json({
    success: true,
    message: `SMTP 250 OK: Handshake verified for ${assignedEmail}. Deliverability test passed.`
  });
});

router.post(['/api/outreach/send-email', '/api/workspace/outreach/send-email'], async (req: Request, res: Response) => {
  const { leadId, leadEmail, leadName, leadCompany, agentId, assignedEmail, senderDisplayName, subject, documentTitle } = req.body;

  if (!leadEmail || !leadEmail.includes('@')) {
    res.status(400).json({ error: "Recipient email is required." });
    return;
  }

  // Find lead if exists in memory and record outbound touchpoint
  const lead = inMemorySovereignLeads.find(l => l.id === leadId);
  if (lead) {
    lead.notes = `${lead.notes || ''}\n[DISPATCH]: Sent "${documentTitle || subject}" via ${assignedEmail} (${senderDisplayName}).`.trim();
    if (lead.stage === 'ENRICHED' || lead.stage === 'NEW_INBOUND') {
      lead.stage = 'OUTREACH_QUEUED';
    }
  }

  console.log(`[OUTREACH] Deal package dispatched: "${subject}" to ${leadEmail} from ${assignedEmail} (${senderDisplayName})`);

  res.json({
    success: true,
    message: `Deal package successfully dispatched to ${leadEmail} via ${assignedEmail}.`,
    lead
  });
});

  return router;
}
