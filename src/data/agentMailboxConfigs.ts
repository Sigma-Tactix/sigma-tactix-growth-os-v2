export interface AgentMailboxConfig {
  agentId: string;
  agentName: string;
  agentRole: string;
  codename: string;
  assignedEmail: string;
  senderDisplayName: string;
  senderTitle: string;
  directPhone?: string;
  calendarBookingUrl?: string;
  signatureHtml?: string;
  avatarUrl?: string;
  
  // Transport Configuration
  transportType: 'SMTP' | 'RESEND' | 'SENDGRID' | 'GOOGLE_WORKSPACE' | 'SIMULATED';
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  apiKey?: string;
  
  // Safety & Deliverability
  dailySendLimit: number;
  currentSentToday: number;
  requiresHITLApproval: boolean;
  status: 'ACTIVE' | 'WARMUP' | 'PAUSED' | 'UNCONFIGURED';
  lastTestedAt?: string;
  deliverabilityScore: number;
}

export interface BrandEmailTheme {
  companyName: string;
  companyDomain: string;
  logoUrl: string;
  primaryAccentColor: string;
  fontFamily: string;
  physicalAddress: string;
  supportEmail: string;
  privacyPolicyUrl: string;
  unsubscribeText: string;
}

export const DEFAULT_BRAND_EMAIL_THEME: BrandEmailTheme = {
  companyName: 'Sigma Tactix',
  companyDomain: 'sigmatactix.com',
  logoUrl: 'https://sigmatactix.com/assets/logo-amber.svg',
  primaryAccentColor: '#F59E0B',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  physicalAddress: 'Sigma Tactix Sovereign Growth OS, Al Faisaliyah Complex, King Fahd Rd, Riyadh, KSA',
  supportEmail: 'advisory@sigmatactix.com',
  privacyPolicyUrl: 'https://sigmatactix.com/privacy',
  unsubscribeText: 'You received this email because your company matches our B2B growth profile. Unsubscribe anytime.'
};

export const INITIAL_AGENT_MAILBOXES: AgentMailboxConfig[] = [
  {
    agentId: 'agent-outreach',
    agentName: 'Sovereign Outreach & Lead Nurturer',
    agentRole: 'Hyper-Targeted B2B Account Intelligence & Outreach',
    codename: 'HERMES-07',
    assignedEmail: 'sdr@sigmatactix.com',
    senderDisplayName: 'Liam Sterling | Sovereign SDR',
    senderTitle: 'B2B Growth Specialist & Revenue Architect',
    directPhone: '+1 (415) 890-3412',
    calendarBookingUrl: 'https://sigmatactix.com/schedule/growth-diagnostic',
    transportType: 'SMTP',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: 'sdr@sigmatactix.com',
    smtpPassword: '••••••••••••••••',
    smtpSecure: true,
    dailySendLimit: 45,
    currentSentToday: 18,
    requiresHITLApproval: true,
    status: 'ACTIVE',
    lastTestedAt: 'Today at 08:30 AM',
    deliverabilityScore: 99.4,
    signatureHtml: `<p style="margin: 0; font-weight: bold; color: #FFFFFF;">Liam Sterling</p>
<p style="margin: 2px 0 0; color: #9CA3AF; font-size: 12px;">Sovereign SDR • Sigma Tactix Growth OS</p>
<p style="margin: 4px 0 0; font-size: 11px; color: #F59E0B;">Direct: +1 (415) 890-3412 • <a href="https://sigmatactix.com/schedule/growth-diagnostic" style="color: #F59E0B; text-decoration: underline;">Book 15-Min Diagnostic</a></p>`
  },
  {
    agentId: 'agent-orchestrator',
    agentName: 'Master Growth Orchestrator',
    agentRole: 'Autonomous Multi-Agent Orchestrator & Global Supervisor',
    codename: 'CHRONOS-00',
    assignedEmail: 'orchestrator@sigmatactix.com',
    senderDisplayName: 'Sigma Tactix Growth Operations',
    senderTitle: 'Autonomous Enterprise Architecture Supervisor',
    directPhone: '+1 (888) 902-TACTIX',
    calendarBookingUrl: 'https://sigmatactix.com/schedule/enterprise-review',
    transportType: 'RESEND',
    apiKey: 're_live_••••••••••••••••••••••••',
    dailySendLimit: 100,
    currentSentToday: 32,
    requiresHITLApproval: true,
    status: 'ACTIVE',
    lastTestedAt: 'Yesterday at 04:15 PM',
    deliverabilityScore: 99.8,
    signatureHtml: `<p style="margin: 0; font-weight: bold; color: #FFFFFF;">Sigma Tactix Growth Operations</p>
<p style="margin: 2px 0 0; color: #9CA3AF; font-size: 12px;">Enterprise Multi-Agent Supervision • Enclave Node 01</p>`
  },
  {
    agentId: 'agent-authority',
    agentName: 'SEO & AEO Authority Architect',
    agentRole: 'Answer Engine Optimization (AEO) & Topical Graphs',
    codename: 'AURA-01',
    assignedEmail: 'authority@sigmatactix.com',
    senderDisplayName: 'Dr. Elena Vance | Authority Research',
    senderTitle: 'Principal AEO & Search Relevance Engineer',
    calendarBookingUrl: 'https://sigmatactix.com/schedule/aeo-audit',
    transportType: 'SMTP',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: 'authority@sigmatactix.com',
    smtpPassword: '••••••••••••••••',
    smtpSecure: true,
    dailySendLimit: 40,
    currentSentToday: 12,
    requiresHITLApproval: true,
    status: 'ACTIVE',
    lastTestedAt: 'Sep 10 at 11:20 AM',
    deliverabilityScore: 98.9,
    signatureHtml: `<p style="margin: 0; font-weight: bold; color: #FFFFFF;">Dr. Elena Vance</p>
<p style="margin: 2px 0 0; color: #9CA3AF; font-size: 12px;">Head of AEO & Knowledge Graph Systems • Sigma Tactix</p>`
  },
  {
    agentId: 'agent-performance',
    agentName: 'Full-Funnel CRO & Ad Creative Optimizer',
    agentRole: 'Algorithmic ROAS Optimization & Creative Testing',
    codename: 'VORTEX-05',
    assignedEmail: 'performance@sigmatactix.com',
    senderDisplayName: 'Marcus Ray | Performance Advisory',
    senderTitle: 'Paid Acquisition & Funnel Economics Lead',
    calendarBookingUrl: 'https://sigmatactix.com/schedule/ad-spend-audit',
    transportType: 'SIMULATED',
    dailySendLimit: 50,
    currentSentToday: 0,
    requiresHITLApproval: true,
    status: 'WARMUP',
    lastTestedAt: 'Never',
    deliverabilityScore: 97.2
  }
];

export function generateBrandedEmailHtml(params: {
  subject: string;
  bodyText: string;
  leadName: string;
  leadCompany: string;
  agentMailbox: AgentMailboxConfig;
  brandTheme: BrandEmailTheme;
}): string {
  const { subject, bodyText, leadName, leadCompany, agentMailbox, brandTheme } = params;
  
  const formattedBody = bodyText
    .replace(/\{\{firstName\}\}/g, leadName.split(' ')[0] || 'there')
    .replace(/\{\{companyName\}\}/g, leadCompany || 'your team')
    .split('\n\n')
    .map(para => `<p style="margin: 0 0 16px; font-size: 14px; line-height: 1.65; color: #E4E4E7;">${para.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #09090B; font-family: ${brandTheme.fontFamily}; color: #FAFAFA;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #121215; border: 1px solid #27272A; border-radius: 12px; overflow: hidden;">
    <!-- Branded Header -->
    <tr>
      <td style="padding: 24px 32px; background: linear-gradient(180deg, #18181B 0%, #121215 100%); border-bottom: 1px solid #27272A;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <span style="display: inline-block; font-size: 16px; font-weight: 800; letter-spacing: -0.02em; color: #FFFFFF;">
                <span style="color: ${brandTheme.primaryAccentColor};">Σ</span> ${brandTheme.companyName.toUpperCase()}
              </span>
            </td>
            <td align="right">
              <span style="font-family: monospace; font-size: 10px; color: ${brandTheme.primaryAccentColor}; background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); padding: 3px 8px; border-radius: 999px; text-transform: uppercase;">
                ${agentMailbox.codename} DIRECT
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px;">
        ${formattedBody}

        <!-- Branded Signature Block -->
        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #27272A;">
          ${agentMailbox.signatureHtml || `
            <p style="margin: 0; font-weight: bold; color: #FFFFFF; font-size: 13px;">${agentMailbox.senderDisplayName}</p>
            <p style="margin: 2px 0 0; color: #A1A1AA; font-size: 12px;">${agentMailbox.senderTitle}</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: ${brandTheme.primaryAccentColor};">${agentMailbox.assignedEmail}</p>
          `}
        </div>
      </td>
    </tr>

    <!-- Footer & CAN-SPAM Compliance -->
    <tr>
      <td style="padding: 20px 32px; background-color: #0D0D10; border-top: 1px solid #1F1F23; font-size: 11px; line-height: 1.5; color: #71717A; text-align: center;">
        <p style="margin: 0 0 6px;">${brandTheme.unsubscribeText}</p>
        <p style="margin: 0 0 8px;">${brandTheme.physicalAddress}</p>
        <p style="margin: 0;">
          <a href="${brandTheme.privacyPolicyUrl}" style="color: #A1A1AA; text-decoration: underline; margin-right: 12px;">Privacy Policy</a>
          <a href="https://${brandTheme.companyDomain}/unsubscribe" style="color: #A1A1AA; text-decoration: underline;">1-Click Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
