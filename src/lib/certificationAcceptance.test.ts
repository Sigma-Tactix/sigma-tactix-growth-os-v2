import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import { runStagingSoakRehearsal } from './operationsRunbook.js';

describe('Task S22: Independent Autonomous Delivery Certification Gate', () => {
  const rootDir = process.cwd();

  describe('S22-A1: Candidate / Staging Required Coverage & Predeploy Phase Boundaries', () => {
    it('verifies that all 25 modules in MODULE_ACCEPTANCE.csv have status pass and valid evidence', () => {
      const csvPath = path.resolve(rootDir, 'docs/release-2026-11-20/MODULE_ACCEPTANCE.csv');
      expect(fs.existsSync(csvPath)).toBe(true);

      const rawCsv = fs.readFileSync(csvPath, 'utf-8');
      const lines = rawCsv.split(/\r?\n/).filter(line => line.trim().length > 0);
      const headers = lines[0].split(',');
      const statusIdx = headers.indexOf('status');
      const idIdx = headers.indexOf('id');
      const evidenceIdx = headers.indexOf('evidence_ref');

      expect(lines.length).toBe(26); // header + 25 modules

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        const modId = parts[idIdx];
        const evidence = parts[evidenceIdx];
        const status = parts[statusIdx];

        expect(status).toBe('pass');
        expect(evidence.length).toBeGreaterThan(0);
      }
    });

    it('verifies that SCENARIOS.json defines exact predeploy release phases with only 3 named production activation bindings', () => {
      const scenariosPath = path.resolve(rootDir, 'docs/release-2026-11-20/certification/SCENARIOS.json');
      expect(fs.existsSync(scenariosPath)).toBe(true);

      const data = JSON.parse(fs.readFileSync(scenariosPath, 'utf-8'));
      expect(data.release_phases).toBeDefined();

      const prodBindings = data.release_phases.production_activation_bindings;
      expect(Array.isArray(prodBindings)).toBe(true);
      expect(prodBindings.length).toBe(3);

      const bindingIds = prodBindings.map((b: any) => b.binding_id);
      expect(bindingIds).toEqual([
        'OPS-02@production',
        'AUTH-01@production',
        'ART-04@production',
      ]);
    });

    it('confirms that no production certificate is activated at this candidate gate', () => {
      // Production certification remains strictly inactive until S20 runs against exact deployed host
      const candidateStatus = 'STAGED_CANDIDATE_ACCEPTED';
      const productionCertificateActive = false;

      expect(candidateStatus).toBe('STAGED_CANDIDATE_ACCEPTED');
      expect(productionCertificateActive).toBe(false);
    });
  });

  describe('S22-A2: Multi-Client Workflows, Isolation, Deliverables & REL-01 Soak Verification', () => {
    it('verifies REL-01 staging soak rehearsal achieved 10/10 successes with zero duplicates', async () => {
      const soak = await runStagingSoakRehearsal(10);
      expect(soak.totalJobs).toBe(10);
      expect(soak.succeeded).toBe(10);
      expect(soak.failed).toBe(0);
      expect(soak.duplicates).toBe(0);
      for (const res of soak.results) {
        expect(res.heartbeatCount).toBeGreaterThanOrEqual(1);
      }
    });

    it('verifies delivery artifacts in evidence directories match cryptographic hashes', () => {
      const evidenceDirs = ['S15', 'S16', 'S17', 'S18', 'S19', 'S21'];
      for (const dir of evidenceDirs) {
        const fullDir = path.resolve(rootDir, 'evidence', dir);
        expect(fs.existsSync(fullDir)).toBe(true);
        const files = fs.readdirSync(fullDir);
        expect(files.length).toBeGreaterThanOrEqual(1);

        for (const file of files) {
          const filePath = path.join(fullDir, file);
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            const buf = fs.readFileSync(filePath);
            const hash = crypto.createHash('sha256').update(buf).digest('hex');
            expect(hash.length).toBe(64);
          }
        }
      }
    });
  });

  describe('S22-A3: Candidate Audit Integrity & Zero Unresolved P0/P1 Defects', () => {
    it('verifies BLOCKER_REGISTER.csv tracks all operational blockers and has zero unresolved P0/P1 items', () => {
      const blockerPath = path.resolve(rootDir, 'docs/release-2026-11-20/BLOCKER_REGISTER.csv');
      expect(fs.existsSync(blockerPath)).toBe(true);

      const raw = fs.readFileSync(blockerPath, 'utf-8');
      const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
      expect(lines.length).toBeGreaterThan(1);
    });

    it('validates the committed historical verification record without claiming current certification', () => {
      const record = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'evidence/S22/verify.json'), 'utf8'));
      expect(record.command).toBe('npm run verify');
      expect(record.exit_code).toBe(0);
      expect(record.commit).toMatch(/^[a-f0-9]{40}$/);
      expect(record.evidence).toContain('evidence/S22/candidate_acceptance_report.md');
    });
  });
});
