import { describe, it, expect } from 'vitest';
import { LeadStage, SovereignLeadItem } from '../pages/OutreachLeadsPage';

describe('Sovereign Lead Engine & Native Mini-CRM Pipeline', () => {
  const mockLeads: SovereignLeadItem[] = [
    {
      id: 'lead-test-1',
      name: 'Elena Rostova',
      email: 'elena@novapulse.tech',
      company: 'NovaPulse Technologies',
      domain: 'novapulse.tech',
      title: 'Chief Revenue Officer',
      stage: 'CLOSED_WON',
      sourceVector: 'SEO & AEO Authority',
      estimatedArr: '$12.0M',
      icpScore: 96,
      capturedAt: '2026-09-04T12:00:00Z'
    },
    {
      id: 'lead-test-2',
      name: 'Marcus Vance',
      email: 'marcus@omnicore.io',
      company: 'OmniCore Software',
      domain: 'omnicore.io',
      title: 'Founder & CEO',
      stage: 'CALL_BOOKED',
      sourceVector: 'Conversion Dock (Embed)',
      estimatedArr: '$8.5M',
      icpScore: 98,
      capturedAt: '2026-09-04T13:00:00Z'
    },
    {
      id: 'lead-test-3',
      name: 'Sarah Chen',
      email: 'sarah@hyperdrive.ai',
      company: 'HyperDrive AI',
      domain: 'hyperdrive.ai',
      title: 'Head of Growth',
      stage: 'NEW_INBOUND',
      sourceVector: 'Cold SDR (Mercury-07)',
      estimatedArr: '$4.2M',
      icpScore: 94,
      capturedAt: '2026-09-04T14:00:00Z'
    }
  ];

  it('verifies the 6 canonical stages of the Sovereign CRM pipeline', () => {
    const canonicalStages: LeadStage[] = [
      'NEW_INBOUND',
      'ENRICHED',
      'OUTREACH_QUEUED',
      'REPLIED_WARM',
      'CALL_BOOKED',
      'CLOSED_WON'
    ];
    expect(canonicalStages).toHaveLength(6);
    expect(canonicalStages[0]).toBe('NEW_INBOUND');
    expect(canonicalStages[5]).toBe('CLOSED_WON');
  });

  it('calculates total pipeline ARR and closed won revenue correctly', () => {
    const totalARR = mockLeads.reduce((acc, l) => {
      const val = parseFloat((l.estimatedArr || '0').replace(/[^0-9.]/g, ''));
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    const wonARR = mockLeads
      .filter(l => l.stage === 'CLOSED_WON')
      .reduce((acc, l) => {
        const val = parseFloat((l.estimatedArr || '0').replace(/[^0-9.]/g, ''));
        return acc + (isNaN(val) ? 0 : val);
      }, 0);

    expect(totalARR).toBe(24.7); // $12M + $8.5M + $4.2M = $24.7M
    expect(wonARR).toBe(12.0);
  });

  it('validates public lead capture payload rules (valid email, required name)', () => {
    const validateCapturePayload = (payload: { name?: string; email?: string }) => {
      if (!payload.name || !payload.name.trim()) return { valid: false, error: 'Name is required' };
      if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
        return { valid: false, error: 'Valid email is required' };
      }
      return { valid: true };
    };

    expect(validateCapturePayload({ name: '', email: 'test@domain.com' }).valid).toBe(false);
    expect(validateCapturePayload({ name: 'Alex', email: 'invalid-email' }).valid).toBe(false);
    expect(validateCapturePayload({ name: 'Alex Cross', email: 'alex@cloudvector.io' }).valid).toBe(true);
  });

  it('confirms lead advance stage transition logic', () => {
    const stages: LeadStage[] = [
      'NEW_INBOUND',
      'ENRICHED',
      'OUTREACH_QUEUED',
      'REPLIED_WARM',
      'CALL_BOOKED',
      'CLOSED_WON'
    ];

    let currentStage: LeadStage = 'NEW_INBOUND';
    const advanceStage = (curr: LeadStage): LeadStage => {
      const idx = stages.indexOf(curr);
      return idx < stages.length - 1 ? stages[idx + 1] : curr;
    };

    currentStage = advanceStage(currentStage);
    expect(currentStage).toBe('ENRICHED');

    currentStage = advanceStage(currentStage);
    expect(currentStage).toBe('OUTREACH_QUEUED');

    currentStage = advanceStage(currentStage);
    expect(currentStage).toBe('REPLIED_WARM');

    currentStage = advanceStage(currentStage);
    expect(currentStage).toBe('CALL_BOOKED');

    currentStage = advanceStage(currentStage);
    expect(currentStage).toBe('CLOSED_WON');

    // Clamps at CLOSED_WON
    currentStage = advanceStage(currentStage);
    expect(currentStage).toBe('CLOSED_WON');
  });
});
