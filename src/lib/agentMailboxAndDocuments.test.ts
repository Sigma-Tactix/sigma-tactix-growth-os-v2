import { describe, it, expect } from 'vitest';
import { 
  INITIAL_AGENT_MAILBOXES, 
  DEFAULT_BRAND_EMAIL_THEME, 
  generateBrandedEmailHtml 
} from '../data/agentMailboxConfigs';
import { 
  STAGE_DOCUMENT_TEMPLATES, 
  AGENCY_CONSULTING_PACKAGES, 
  generateDocumentMarkdown 
} from '../data/agencyConsultingPackages';

describe('Agent Mailbox & Branded Email Engine', () => {
  it('loads default agent mailboxes with valid sender profiles', () => {
    expect(INITIAL_AGENT_MAILBOXES.length).toBeGreaterThanOrEqual(3);
    const sdr = INITIAL_AGENT_MAILBOXES.find(m => m.agentId === 'agent-outreach');
    expect(sdr).toBeDefined();
    expect(sdr?.assignedEmail).toBe('sdr@sigmatactix.com');
    expect(sdr?.codename).toBe('HERMES-07');
    expect(sdr?.dailySendLimit).toBe(45);
    expect(sdr?.requiresHITLApproval).toBe(true);
  });

  it('generates fully branded HTML emails with token replacement and CAN-SPAM compliance', () => {
    const sdr = INITIAL_AGENT_MAILBOXES[0];
    const html = generateBrandedEmailHtml({
      subject: 'Growth Diagnostic for FinScale',
      bodyText: 'Hi {{firstName}},\n\nNoticed {{companyName}} is growing fast but losing mobile traffic.',
      leadName: 'Jordan Miller',
      leadCompany: 'FinScale Inc',
      agentMailbox: sdr,
      brandTheme: DEFAULT_BRAND_EMAIL_THEME
    });

    expect(html).toContain('Jordan');
    expect(html).toContain('FinScale Inc');
    expect(html).toContain('HERMES-07 DIRECT');
    expect(html).toContain(DEFAULT_BRAND_EMAIL_THEME.companyName.toUpperCase());
    expect(html).toContain('1-Click Unsubscribe');
    expect(html).toContain(DEFAULT_BRAND_EMAIL_THEME.physicalAddress);
    expect(html).toContain('Liam Sterling');
  });
});

describe('Stage-by-Stage Deal Documents & Consulting Packages', () => {
  const sampleLead = {
    name: 'Sarah Chen',
    company: 'HyperDrive AI',
    title: 'Head of Growth',
    domain: 'hyperdrive.ai',
    estimatedArr: '$4.2M'
  };

  it('provides all required consulting packages across stages', () => {
    expect(AGENCY_CONSULTING_PACKAGES.length).toBe(3);
    const names = AGENCY_CONSULTING_PACKAGES.map(p => p.id);
    expect(names).toContain('package-diagnostic');
    expect(names).toContain('package-accelerator');
    expect(names).toContain('package-retainer');
  });

  it('generates Prospecting Stage: Empirical Growth Diagnostic Teardown with lead variables', () => {
    const markdown = generateDocumentMarkdown('DIAGNOSTIC_TEARDOWN', sampleLead, {
      selectedPackageId: 'package-diagnostic'
    });

    expect(markdown).toContain('EMPIRICAL GROWTH AUDIT & FORENSIC TEARDOWN');
    expect(markdown).toContain('HyperDrive AI');
    expect(markdown).toContain('Sarah Chen');
    expect(markdown).toContain('hyperdrive.ai');
    expect(markdown).toContain('$4.2M ARR');
    expect(markdown).toContain('First Contentful Paint');
    expect(markdown).toContain('Answer Engine Invisibility');
  });

  it('generates Discussing Stage: Mutual Non-Disclosure Agreement (M-NDA)', () => {
    const markdown = generateDocumentMarkdown('MUTUAL_NDA', sampleLead, {});

    expect(markdown).toContain('MUTUAL NON-DISCLOSURE & CONFIDENTIALITY AGREEMENT (M-NDA)');
    expect(markdown).toContain('HyperDrive AI');
    expect(markdown).toContain('Sigma Tactix Technologies Ltd.');
    expect(markdown).toContain('Permitted Purpose');
    expect(markdown).toContain('Sarah Chen');
  });

  it('generates Discussing Stage: Agency Consulting Offerings Proposal with selected tier', () => {
    const markdown = generateDocumentMarkdown('OFFERINGS_PROPOSAL', sampleLead, {
      selectedPackageId: 'package-accelerator',
      customFee: '$12,500'
    });

    expect(markdown).toContain('STRATEGIC CONSULTING & GROWTH OS PROPOSAL');
    expect(markdown).toContain('90-Day Sovereign Growth OS Deployment');
    expect(markdown).toContain('$12,500');
    expect(markdown).toContain('HERMES-07');
    expect(markdown).toContain('Human-in-the-Loop');
  });

  it('generates Closing Stage: Master Services Agreement (MSA)', () => {
    const markdown = generateDocumentMarkdown('MASTER_SERVICES_AGREEMENT', sampleLead, {});

    expect(markdown).toContain('MASTER SERVICES AGREEMENT (MSA)');
    expect(markdown).toContain('Intellectual Property & Data Sovereignty');
    expect(markdown).toContain('Client IP');
    expect(markdown).toContain('Limitation of Liability');
  });

  it('generates Closing Stage: Statement of Work (SOW)', () => {
    const markdown = generateDocumentMarkdown('STATEMENT_OF_WORK', sampleLead, {
      selectedPackageId: 'package-retainer',
      customFee: '$6,500 / mo'
    });

    expect(markdown).toContain('STATEMENT OF WORK');
    expect(markdown).toContain('$6,500 / mo');
    expect(markdown).toContain('Sprint 1');
    expect(markdown).toContain('Sprint 2');
    expect(markdown).toContain('Deliverables Matrix & Acceptance Criteria');
  });

  it('generates Closing Stage: Client Retainer Onboarding Packet', () => {
    const markdown = generateDocumentMarkdown('ONBOARDING_PACKET', sampleLead, {});

    expect(markdown).toContain('CLIENT RETAINER KICKOFF & ENCLAVE INTAKE PACKET');
    expect(markdown).toContain('14-Day Onboarding Flight Plan');
    expect(markdown).toContain('Credentials Intake');
    expect(markdown).toContain('Second Brain Knowledge Documents');
    expect(markdown).toContain('sdr@hyperdrive.ai');
  });
});
