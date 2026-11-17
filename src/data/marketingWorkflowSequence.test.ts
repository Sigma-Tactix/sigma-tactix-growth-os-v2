import { describe, expect, it } from 'vitest';
import {
  MARKETING_LIFECYCLE_STAGES,
  getLifecycleStage,
  getStageForModule,
} from './marketingWorkflowSequence';
import { SUITE_MODULES, SUITE_HUBS } from './suiteHubConfig';

describe('Sequential Marketing Lifecycle and Module Architecture (Task S14)', () => {
  describe('S14-A1: 8-Stage Sequential Workflow Progression', () => {
    it('defines the complete 8-stage sequence in correct operational order', () => {
      const expectedStages = [
        'setup',
        'understand',
        'plan',
        'create',
        'review',
        'execute',
        'measure',
        'learn',
      ];

      expect(MARKETING_LIFECYCLE_STAGES).toHaveLength(8);
      expect(MARKETING_LIFECYCLE_STAGES.map((s) => s.id)).toEqual(expectedStages);
      MARKETING_LIFECYCLE_STAGES.forEach((stage, index) => {
        expect(stage.order).toBe(index + 1);
        expect(stage.label).toContain(`${index + 1}.`);
        expect(stage.primaryRoute).toBeDefined();
        expect(stage.deliverables.length).toBeGreaterThanOrEqual(3);
        expect(stage.icon).toBeDefined();
      });
    });

    it('maps every stage to its primary navigation route', () => {
      expect(getLifecycleStage('setup')?.primaryRoute).toBe('/vaults');
      expect(getLifecycleStage('understand')?.primaryRoute).toBe('/suite/intelligence?tab=intel-simulator');
      expect(getLifecycleStage('plan')?.primaryRoute).toBe('/diagnostics');
      expect(getLifecycleStage('create')?.primaryRoute).toBe('/suite/creative?tab=creative-editorial');
      expect(getLifecycleStage('review')?.primaryRoute).toBe('/queue');
      expect(getLifecycleStage('execute')?.primaryRoute).toBe('/suite/social?tab=social-publishing');
      expect(getLifecycleStage('measure')?.primaryRoute).toBe('/attribution');
      expect(getLifecycleStage('learn')?.primaryRoute).toBe('/team-learnings');
    });

    it('resolves stages for individual module keys', () => {
      expect(getStageForModule('creative-editorial').id).toBe('create');
      expect(getStageForModule('intel-simulator').id).toBe('understand');
      expect(getStageForModule('social-publishing').id).toBe('execute');
      expect(getStageForModule('demand-outreach').id).toBe('plan');
      expect(getStageForModule('measurement').id).toBe('measure');
    });
  });

  describe('S14-A2: 6 Operational Dimensions on Every Module', () => {
    it('verifies every released module specifies purpose, input, mainAction, output, status, and nextStep', () => {
      expect(SUITE_MODULES).toHaveLength(14);

      for (const module of SUITE_MODULES) {
        expect(module.purpose, `purpose for ${module.label}`).toBeDefined();
        expect(module.purpose.length, `purpose length for ${module.label}`).toBeGreaterThan(15);

        expect(module.input, `input for ${module.label}`).toBeDefined();
        expect(module.input.length, `input length for ${module.label}`).toBeGreaterThan(10);

        expect(module.mainAction, `mainAction for ${module.label}`).toBeDefined();
        expect(module.mainAction.length, `mainAction length for ${module.label}`).toBeGreaterThan(5);

        expect(module.output, `output for ${module.label}`).toBeDefined();
        expect(module.output.length, `output length for ${module.label}`).toBeGreaterThan(10);

        expect(module.status, `status for ${module.label}`).toMatch(/Ready|Configured|Warning|Syncing/);

        expect(module.nextStep, `nextStep for ${module.label}`).toBeDefined();
        expect(module.nextStep.length, `nextStep length for ${module.label}`).toBeGreaterThan(10);

        expect(module.lifecycleStage, `lifecycleStage for ${module.label}`).toBeDefined();
      }
    });

    it('verifies all 6 suite hubs map to standard marketing departments', () => {
      const hubs = Object.values(SUITE_HUBS);
      expect(hubs).toHaveLength(6);
      for (const hub of hubs) {
        expect(hub.department).toBeDefined();
        expect(hub.modules.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('S14-A3: Deep Links and Operational Integrity', () => {
    it('preserves all original standalone routes across all 14 modules', () => {
      const expectedRoutes = [
        '/content',
        '/image-studio',
        '/video-studio',
        '/social-carousels',
        '/social-listening',
        '/seo-aeo',
        '/cro-studio',
        '/intake',
        '/outreach',
        '/paid-ads',
        '/email-marketing',
        '/competitors',
        '/market-simulator',
        '/attribution',
      ];

      const moduleRoutes = SUITE_MODULES.map((m) => m.href);
      for (const route of expectedRoutes) {
        expect(moduleRoutes).toContain(route);
      }
    });
  });
});
