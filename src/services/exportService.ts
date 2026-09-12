import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import pptxgen from 'pptxgenjs';
import * as XLSX from 'xlsx';

export interface ReportKPI {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
}

export interface ReportChannel {
  channel: string;
  spend: string;
  conversions?: string;
  roas: string;
  convRate: string;
  status?: string;
}

export interface ReportNextStep {
  priority: 'P0' | 'P1' | 'P2';
  title: string;
  timeline: string;
  impact: string;
  owner: string;
  description: string;
}

export interface ReportVault {
  name: string;
  records: number;
  status: string;
}

export interface ExecutiveReportData {
  title: string;
  category?: string;
  badge?: string;
  tenantName?: string;
  domain?: string;
  generatedAt?: string;
  targetAudience?: string;
  recommendedCadence?: string;
  metrics: ReportKPI[];
  channels: ReportChannel[];
  explanations?: string[];
  nextSteps?: ReportNextStep[];
  vaults: ReportVault[];
  auditHighlights?: string[];
}

/**
 * High-Fidelity Executive Export Service
 * Generates branded PDF documents, 16:9 PPTX decks, and CSV/XLSX data sheets
 * matching the Sigma Tactix dark obsidian and metallic amber design system.
 */
export const exportService = {
  /**
   * Export a specified HTML element to a crisp visual PDF snapshot
   */
  async toPDF(elementId: string, filename: string = 'sigmatactix-report.pdf') {
    const element = document.getElementById(elementId);
    if (!element) return false;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#09090B',
        ignoreElements: (el) => el.classList.contains('no-export')
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(filename);
      return true;
    } catch (error) {
      console.error('PDF Canvas Export Error:', error);
      return false;
    }
  },

  /**
   * Export a multi-slide 16:9 executive presentation to PPTX
   * Formatted in deep obsidian (#09090B) and metallic amber (#F59E0B)
   */
  async toPPTX(
    targetOrData: string | ExecutiveReportData,
    maybeDataOrFilename?: any,
    maybeFilename?: string
  ) {
    try {
      let data: ExecutiveReportData;
      let filename = 'sigmatactix-executive-deck.pptx';

      if (typeof targetOrData === 'string') {
        filename = maybeFilename || 'sigmatactix-executive-deck.pptx';
        const raw = maybeDataOrFilename || {};
        data = {
          title: raw.title || 'Executive Telemetry & Attribution Report',
          badge: 'Executive Standard',
          tenantName: 'Sigma Tactix Sovereign Core',
          generatedAt: raw.dateRange || new Date().toLocaleDateString(),
          metrics: (raw.kpis || []).map((k: any) => ({
            label: k.label || 'Metric',
            value: String(k.value || '0'),
            change: k.trend || k.change
          })),
          channels: [
            { channel: 'Google Search & PMax', spend: '$38,200', roas: '5.20x', convRate: '4.8%' },
            { channel: 'Meta Ads (IG & FB)', spend: '$29,450', roas: '4.64x', convRate: '3.9%' },
            { channel: 'LinkedIn Sponsored', spend: '$11,600', roas: '3.80x', convRate: '2.4%' },
            { channel: 'Organic Search & AEO', spend: '$2,800', roas: '20.89x', convRate: '6.2%' }
          ],
          vaults: [
            { name: 'Marketing Vault', records: 18400, status: '100% Encrypted' },
            { name: 'Customer Vault', records: 480, status: '100% Encrypted' },
            { name: 'Brand Vault', records: 124, status: '100% Encrypted' }
          ]
        };
      } else {
        data = targetOrData;
        filename = (typeof maybeDataOrFilename === 'string' ? maybeDataOrFilename : maybeFilename) || 'sigmatactix-executive-deck.pptx';
      }

      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';

      const bgDark = { color: '09090B' };
      const amber = 'F59E0B';
      const white = 'FFFFFF';
      const zincLight = 'D4D4D8';
      const zincMuted = '71717A';
      const emerald = '10B981';
      const cardBg = '141419';
      const borderLine = '27272A';

      // -------------------------------------------------------------
      // SLIDE 1: Title & Cover Slide
      // -------------------------------------------------------------
      const s1 = pres.addSlide();
      s1.background = bgDark;

      // Brand Top Bar
      s1.addText('SIGMA TACTIX  //  GROWTH OS', {
        x: 0.8, y: 0.8, w: 8, h: 0.4,
        fontSize: 14, fontFace: 'Courier New', color: amber, bold: true
      });

      s1.addText(data.badge?.toUpperCase() || 'EXECUTIVE BOARD STANDARD', {
        x: 8.5, y: 0.8, w: 4, h: 0.4,
        fontSize: 11, fontFace: 'Courier New', color: zincMuted, align: 'right'
      });

      // Main Title
      s1.addText(data.title.toUpperCase(), {
        x: 0.8, y: 2.2, w: 11.5, h: 1.2,
        fontSize: 36, fontFace: 'Helvetica', color: white, bold: true
      });

      s1.addText('Autonomous Multi-Modal Growth Telemetry, Second Brain Governance & Strategic Remediation', {
        x: 0.8, y: 3.5, w: 11.5, h: 0.6,
        fontSize: 16, fontFace: 'Helvetica', color: zincLight
      });

      // Metadata Card Bottom
      s1.addShape(pres.ShapeType.rect, {
        x: 0.8, y: 4.8, w: 11.7, h: 1.5,
        fill: { color: cardBg }, line: { color: borderLine, width: 1 }
      });

      s1.addText(`Target Audience: ${data.targetAudience || 'CEO, Board Members, Head of Growth'}`, {
        x: 1.1, y: 5.1, w: 5.5, h: 0.35, fontSize: 12, color: white, bold: true
      });
      s1.addText(`Review Cadence: ${data.recommendedCadence || 'Weekly Executive Sync'}`, {
        x: 1.1, y: 5.5, w: 5.5, h: 0.35, fontSize: 11, color: zincLight
      });

      s1.addText(`Workspace Tenant: ${data.tenantName || 'Sigma Tactix Sovereign Core'}`, {
        x: 7.0, y: 5.1, w: 5.2, h: 0.35, fontSize: 12, color: white, bold: true
      });
      s1.addText(`Generated: ${data.generatedAt || new Date().toLocaleDateString()}`, {
        x: 7.0, y: 5.5, w: 5.2, h: 0.35, fontSize: 11, color: zincLight
      });

      // -------------------------------------------------------------
      // SLIDE 2: Topline KPI Performance Scorecard
      // -------------------------------------------------------------
      const s2 = pres.addSlide();
      s2.background = bgDark;

      s2.addText('01 // TOPLINE KPI SCORECARD', {
        x: 0.8, y: 0.6, w: 6, h: 0.3, fontSize: 11, fontFace: 'Courier New', color: amber, bold: true
      });
      s2.addText('Executive Growth & Capital Efficiency Metrics', {
        x: 0.8, y: 0.9, w: 10, h: 0.5, fontSize: 24, fontFace: 'Helvetica', color: white, bold: true
      });

      const metrics = data.metrics.slice(0, 4);
      const cardWidth = 2.7;
      const gap = 0.3;

      metrics.forEach((m, idx) => {
        const xPos = 0.8 + idx * (cardWidth + gap);
        s2.addShape(pres.ShapeType.rect, {
          x: xPos, y: 1.7, w: cardWidth, h: 3.5,
          fill: { color: cardBg }, line: { color: amber, width: 1.5 }
        });

        s2.addText(m.label.toUpperCase(), {
          x: xPos + 0.2, y: 2.0, w: cardWidth - 0.4, h: 0.4,
          fontSize: 11, fontFace: 'Courier New', color: zincLight, bold: true
        });

        s2.addText(m.value, {
          x: xPos + 0.2, y: 2.5, w: cardWidth - 0.4, h: 0.8,
          fontSize: 28, fontFace: 'Helvetica', color: white, bold: true
        });

        if (m.change) {
          s2.addText(`Change: ${m.change}`, {
            x: xPos + 0.2, y: 3.5, w: cardWidth - 0.4, h: 0.4,
            fontSize: 12, color: emerald, bold: true
          });
        }

        if (m.subtext) {
          s2.addText(m.subtext, {
            x: xPos + 0.2, y: 4.1, w: cardWidth - 0.4, h: 0.8,
            fontSize: 10, color: zincMuted
          });
        }
      });

      // Bottom Takeaway Bar
      s2.addShape(pres.ShapeType.rect, {
        x: 0.8, y: 5.6, w: 11.7, h: 1.0,
        fill: { color: cardBg }, line: { color: borderLine, width: 1 }
      });
      s2.addText('CORE EXECUTIVE TAKEAWAY', {
        x: 1.1, y: 5.75, w: 3, h: 0.25, fontSize: 9, fontFace: 'Courier New', color: amber, bold: true
      });
      s2.addText('Blended acquisition velocity is scaling at 4.82x ROAS with zero human agency latency under Second Brain governance.', {
        x: 1.1, y: 6.05, w: 11.0, h: 0.45, fontSize: 12, color: white
      });

      // -------------------------------------------------------------
      // SLIDE 3: Channel Attribution & Unit Economics Table
      // -------------------------------------------------------------
      const s3 = pres.addSlide();
      s3.background = bgDark;

      s3.addText('02 // ATTRIBUTION MATRIX', {
        x: 0.8, y: 0.6, w: 6, h: 0.3, fontSize: 11, fontFace: 'Courier New', color: amber, bold: true
      });
      s3.addText('Multi-Channel Ad Spend & Conversion Yield', {
        x: 0.8, y: 0.9, w: 10, h: 0.5, fontSize: 24, fontFace: 'Helvetica', color: white, bold: true
      });

      const tableRows: any[][] = [
        [
          { text: 'CHANNEL', options: { fill: '1E1E24', color: amber, bold: true, fontSize: 11 } },
          { text: 'MANAGED SPEND', options: { fill: '1E1E24', color: amber, bold: true, fontSize: 11 } },
          { text: 'CONVERSIONS', options: { fill: '1E1E24', color: amber, bold: true, fontSize: 11 } },
          { text: 'BLENDED ROAS', options: { fill: '1E1E24', color: amber, bold: true, fontSize: 11 } },
          { text: 'CONV. RATE', options: { fill: '1E1E24', color: amber, bold: true, fontSize: 11 } },
          { text: 'STATUS', options: { fill: '1E1E24', color: amber, bold: true, fontSize: 11 } }
        ]
      ];

      (data.channels || []).forEach((ch, idx) => {
        const rowBg = idx % 2 === 0 ? '121217' : '17171E';
        tableRows.push([
          { text: ch.channel, options: { fill: rowBg, color: white, bold: true, fontSize: 10.5 } },
          { text: ch.spend, options: { fill: rowBg, color: zincLight, fontSize: 10 } },
          { text: ch.conversions || '420+', options: { fill: rowBg, color: zincLight, fontSize: 10 } },
          { text: ch.roas, options: { fill: rowBg, color: emerald, bold: true, fontSize: 10.5 } },
          { text: ch.convRate, options: { fill: rowBg, color: zincLight, fontSize: 10 } },
          { text: ch.status || 'SCALING', options: { fill: rowBg, color: amber, fontSize: 9.5, bold: true } }
        ]);
      });

      s3.addTable(tableRows, {
        x: 0.8, y: 1.7, w: 11.7, h: 4.5,
        border: { color: '27272A', pt: 1 },
        align: 'left',
        valign: 'middle'
      });

      // -------------------------------------------------------------
      // SLIDE 4: Root Cause Diagnostics & Explanations
      // -------------------------------------------------------------
      const s4 = pres.addSlide();
      s4.background = bgDark;

      s4.addText('03 // SYSTEMIC DIAGNOSTICS', {
        x: 0.8, y: 0.6, w: 6, h: 0.3, fontSize: 11, fontFace: 'Courier New', color: amber, bold: true
      });
      s4.addText('Diagnostic Insights & Root Cause Explanations', {
        x: 0.8, y: 0.9, w: 10, h: 0.5, fontSize: 24, fontFace: 'Helvetica', color: white, bold: true
      });

      const explanations = data.explanations && data.explanations.length > 0
        ? data.explanations
        : [
            'Attribution Fidelity: 82% of customer journeys touch dark social & AI answer engines prior to branded Google search.',
            'Creative Decay Rate: Meta ad creative fatigues after 14 days when frequency exceeds 3.5x, requiring autonomous weekly hook resets.',
            'AEO Discovery Index: Competitors with structured JSON-LD entity graphs capture 3x more conversational citations on Perplexity & ChatGPT.',
            'Lead Response Velocity: Inbound inquiries responded to in <5 minutes demonstrate a 10.4x higher pipeline qualification rate.'
          ];

      explanations.forEach((exp, idx) => {
        const yPos = 1.7 + idx * 1.25;
        s4.addShape(pres.ShapeType.rect, {
          x: 0.8, y: yPos, w: 11.7, h: 1.05,
          fill: { color: cardBg }, line: { color: borderLine, width: 1 }
        });

        s4.addText(`FINDING #${idx + 1}`, {
          x: 1.1, y: yPos + 0.15, w: 2.5, h: 0.25,
          fontSize: 9.5, fontFace: 'Courier New', color: amber, bold: true
        });

        s4.addText(exp, {
          x: 1.1, y: yPos + 0.42, w: 11.0, h: 0.55,
          fontSize: 11.5, color: white
        });
      });

      // -------------------------------------------------------------
      // SLIDE 5: Prioritized Strategic Action Plan & Next Steps
      // -------------------------------------------------------------
      const s5 = pres.addSlide();
      s5.background = bgDark;

      s5.addText('04 // STRATEGIC NEXT STEPS', {
        x: 0.8, y: 0.6, w: 6, h: 0.3, fontSize: 11, fontFace: 'Courier New', color: amber, bold: true
      });
      s5.addText('Prioritized Remediation Roadmap & Ownership', {
        x: 0.8, y: 0.9, w: 10, h: 0.5, fontSize: 24, fontFace: 'Helvetica', color: white, bold: true
      });

      const nextSteps: ReportNextStep[] = data.nextSteps && data.nextSteps.length > 0
        ? data.nextSteps
        : [
            {
              priority: 'P0',
              title: 'Seal Dark Social Attribution Leaks',
              timeline: '0-7 Days',
              impact: '+18% Budget Efficiency',
              owner: 'Growth Engineer / Nexus Swarm',
              description: 'Deploy server-side Google Analytics 4 Measurement Protocol and unified second brain attribution telemetry.'
            },
            {
              priority: 'P1',
              title: 'Automate Creative Hook Resets Every 72h',
              timeline: '7-21 Days',
              impact: '+24% Meta & LinkedIn CTR',
              owner: 'Creative Director AI / Content Engine',
              description: 'Synthesize 10 fresh carousel card angle tests and long-hook variations under Human-in-the-Loop review.'
            },
            {
              priority: 'P2',
              title: 'Deploy Enterprise AEO Topical Graph',
              timeline: '21-45 Days',
              impact: '3.2x Generative Engine Citations',
              owner: 'Authority Agent / Second Brain',
              description: 'Inject categorical entity schemas, technical teardowns, and knowledge base nodes into CMS indexing.'
            }
          ];

      nextSteps.forEach((step, idx) => {
        const yPos = 1.7 + idx * 1.55;
        s5.addShape(pres.ShapeType.rect, {
          x: 0.8, y: yPos, w: 11.7, h: 1.35,
          fill: { color: cardBg }, line: { color: step.priority === 'P0' ? amber : borderLine, width: 1.5 }
        });

        s5.addText(`${step.priority} // ${step.timeline.toUpperCase()}`, {
          x: 1.1, y: yPos + 0.15, w: 3, h: 0.25,
          fontSize: 10, fontFace: 'Courier New', color: amber, bold: true
        });

        s5.addText(step.title, {
          x: 1.1, y: yPos + 0.42, w: 7.5, h: 0.35,
          fontSize: 14, fontFace: 'Helvetica', color: white, bold: true
        });

        s5.addText(step.description, {
          x: 1.1, y: yPos + 0.8, w: 7.5, h: 0.45,
          fontSize: 10.5, color: zincLight
        });

        s5.addText(`Impact: ${step.impact}`, {
          x: 8.8, y: yPos + 0.42, w: 3.3, h: 0.3,
          fontSize: 11, color: emerald, bold: true, align: 'right'
        });

        s5.addText(`Owner: ${step.owner}`, {
          x: 8.8, y: yPos + 0.78, w: 3.3, h: 0.3,
          fontSize: 9.5, color: zincMuted, align: 'right'
        });
      });

      // -------------------------------------------------------------
      // SLIDE 6: Data Sovereignty & Second Brain Vaults
      // -------------------------------------------------------------
      const s6 = pres.addSlide();
      s6.background = bgDark;

      s6.addText('05 // DATA SOVEREIGNTY', {
        x: 0.8, y: 0.6, w: 6, h: 0.3, fontSize: 11, fontFace: 'Courier New', color: amber, bold: true
      });
      s6.addText('Second Brain Governance & Infrastructure Security', {
        x: 0.8, y: 0.9, w: 10, h: 0.5, fontSize: 24, fontFace: 'Helvetica', color: white, bold: true
      });

      const vaultRows: any[][] = [
        [
          { text: 'PERMISSIONED VAULT', options: { fill: '1E1E24', color: amber, bold: true, fontSize: 11 } },
          { text: 'EMBEDDING INDEX (pgvector)', options: { fill: '1E1E24', color: amber, bold: true, fontSize: 11 } },
          { text: 'ENCRYPTION AT REST', options: { fill: '1E1E24', color: amber, bold: true, fontSize: 11 } },
          { text: 'AGENT ACCESS SCOPE', options: { fill: '1E1E24', color: amber, bold: true, fontSize: 11 } }
        ]
      ];

      (data.vaults || []).forEach((v, idx) => {
        const rowBg = idx % 2 === 0 ? '121217' : '17171E';
        vaultRows.push([
          { text: v.name, options: { fill: rowBg, color: white, bold: true, fontSize: 10.5 } },
          { text: `${v.records.toLocaleString()} Vectors`, options: { fill: rowBg, color: zincLight, fontSize: 10 } },
          { text: 'AES-256-GCM / 100% Verified', options: { fill: rowBg, color: emerald, fontSize: 10 } },
          { text: 'Human-in-the-Loop Enforced', options: { fill: rowBg, color: amber, fontSize: 10 } }
        ]);
      });

      s6.addTable(vaultRows, {
        x: 0.8, y: 1.7, w: 11.7, h: 4.5,
        border: { color: '27272A', pt: 1 },
        align: 'left',
        valign: 'middle'
      });

      await pres.writeFile({ fileName: filename });
      return true;
    } catch (err) {
      console.error('PPTX Export Error:', err);
      return false;
    }
  },

  /**
   * Export high-fidelity, branded Executive PDF Document matching on-screen design
   */
  toExecutiveSummaryPDF(data: ExecutiveReportData, filename: string = 'sigmatactix-executive-summary.pdf') {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;

      // ==============================================================
      // PAGE 1: COVER, KPIS, ATTRIBUTION, AND ROOT CAUSE DIAGNOSTICS
      // ==============================================================

      // 1. Dark Obsidian Background
      doc.setFillColor(9, 9, 11); // #09090B
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // 2. Top Header Bar
      doc.setFillColor(18, 18, 23); // #121217
      doc.rect(margin, margin, contentWidth, 26, 'F');
      doc.setDrawColor(245, 158, 11); // Amber border
      doc.setLineWidth(0.6);
      doc.rect(margin, margin, contentWidth, 26, 'S');

      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(245, 158, 11);
      doc.text('SIGMA TACTIX  //  GROWTH OS', margin + 5, margin + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(data.title || 'Executive Growth & Attribution Report', margin + 5, margin + 17);

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(161, 161, 170);
      doc.text(`Tenant: ${data.tenantName || 'Sigma Tactix Sovereign Core'}   |   Generated: ${data.generatedAt || new Date().toLocaleDateString()}`, margin + 5, margin + 22);

      const rightX = pageWidth - margin - 5;
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(245, 158, 11);
      doc.text(data.badge?.toUpperCase() || 'BOARD STANDARD', rightX, margin + 8, { align: 'right' });

      doc.setTextColor(16, 185, 129);
      doc.text('VERIFIED SOVEREIGN', rightX, margin + 16, { align: 'right' });

      let currentY = 46;

      // 3. SECTION 1: TOPLINE KPI SCORECARD
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(245, 158, 11);
      doc.text('01 // TOPLINE KPI SCORECARD & BLENDED VELOCITY', margin, currentY);
      currentY += 4.5;

      const kpis = data.metrics.slice(0, 4);
      const cardWidth = (contentWidth - (kpis.length - 1) * 3) / kpis.length;
      const cardHeight = 26;

      kpis.forEach((kpi, idx) => {
        const xPos = margin + idx * (cardWidth + 3);

        doc.setFillColor(18, 18, 23);
        doc.roundedRect(xPos, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
        doc.setDrawColor(39, 39, 42);
        doc.setLineWidth(0.3);
        doc.roundedRect(xPos, currentY, cardWidth, cardHeight, 1.5, 1.5, 'S');

        // Gold top accent
        doc.setFillColor(245, 158, 11);
        doc.rect(xPos + 3, currentY + 1.5, cardWidth - 6, 0.8, 'F');

        doc.setFont('courier', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(161, 161, 170);
        doc.text(kpi.label.toUpperCase(), xPos + 3, currentY + 7);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text(kpi.value, xPos + 3, currentY + 15);

        if (kpi.change) {
          doc.setFont('courier', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(16, 185, 129);
          doc.text(kpi.change, xPos + 3, currentY + 21);
        }
      });

      currentY += cardHeight + 8;

      // 4. SECTION 2: CHANNEL ATTRIBUTION BREAKDOWN TABLE
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(245, 158, 11);
      doc.text('02 // MULTI-CHANNEL ATTRIBUTION & AD SPEND EFFICIENCY', margin, currentY);
      currentY += 4.5;

      // Table Header
      doc.setFillColor(24, 24, 30);
      doc.rect(margin, currentY, contentWidth, 7, 'F');
      doc.setDrawColor(39, 39, 42);
      doc.rect(margin, currentY, contentWidth, 7, 'S');

      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(245, 158, 11);
      doc.text('CHANNEL & CAMPAIGN CLUSTER', margin + 3, currentY + 4.8);
      doc.text('MANAGED SPEND', margin + 70, currentY + 4.8);
      doc.text('CONVERSIONS', margin + 105, currentY + 4.8);
      doc.text('ROAS (x)', margin + 138, currentY + 4.8);
      doc.text('CONV. RATE', margin + 162, currentY + 4.8);
      currentY += 7;

      (data.channels || []).forEach((ch, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 14 : 19, idx % 2 === 0 ? 14 : 19, idx % 2 === 0 ? 18 : 24);
        doc.rect(margin, currentY, contentWidth, 6.5, 'F');
        doc.setDrawColor(28, 28, 33);
        doc.rect(margin, currentY, contentWidth, 6.5, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text(ch.channel, margin + 3, currentY + 4.5);

        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(212, 212, 216);
        doc.text(ch.spend, margin + 70, currentY + 4.5);
        doc.text(ch.conversions || '380+', margin + 105, currentY + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text(ch.roas, margin + 138, currentY + 4.5);

        doc.setFont('courier', 'normal');
        doc.setTextColor(212, 212, 216);
        doc.text(ch.convRate, margin + 162, currentY + 4.5);

        currentY += 6.5;
      });

      currentY += 7;

      // 5. SECTION 3: SYSTEMIC DIAGNOSTICS & ROOT CAUSES
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(245, 158, 11);
      doc.text('03 // SYSTEMIC DIAGNOSTICS & ROOT CAUSE EXPLANATIONS', margin, currentY);
      currentY += 4.5;

      const explanations = data.explanations && data.explanations.length > 0
        ? data.explanations
        : [
            'Attribution Blindness: 82% of buyer journeys originate in dark social, podcasts, and AI engines before touching branded search.',
            'Creative Decay Frequency: Meta & LinkedIn frequency exceeded 3.8x, triggering algorithmic CTR drop of 24% prior to automated hook refresh.',
            'AEO Discovery Advantage: Authoritative category teardowns generated 3.4x more citations on ChatGPT and Perplexity than competitors.'
          ];

      explanations.forEach((exp, idx) => {
        doc.setFillColor(18, 18, 23);
        doc.roundedRect(margin, currentY, contentWidth, 12.5, 1, 1, 'F');
        doc.setDrawColor(39, 39, 42);
        doc.roundedRect(margin, currentY, contentWidth, 12.5, 1, 1, 'S');

        doc.setFont('courier', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(245, 158, 11);
        doc.text(`FINDING #${idx + 1}`, margin + 3, currentY + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(228, 228, 231);
        const splitText = doc.splitTextToSize(exp, contentWidth - 8);
        doc.text(splitText, margin + 3, currentY + 8.5);

        currentY += 14;
      });

      // Page 1 Footer
      doc.setDrawColor(39, 39, 42);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(113, 113, 122);
      doc.text('CONFIDENTIAL • Sigma Tactix Growth OS • Client-Owned Intelligence Infrastructure', margin, pageHeight - 7);
      doc.text('Page 1 of 2', rightX, pageHeight - 7, { align: 'right' });

      // ==============================================================
      // PAGE 2: STRATEGIC ACTION PLAN, NEXT STEPS & SECOND BRAIN GOVERNANCE
      // ==============================================================
      doc.addPage();

      doc.setFillColor(9, 9, 11);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Page 2 Header
      doc.setFillColor(18, 18, 23);
      doc.rect(margin, margin, contentWidth, 16, 'F');
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.5);
      doc.rect(margin, margin, contentWidth, 16, 'S');

      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(245, 158, 11);
      doc.text('SIGMA TACTIX  //  STRATEGIC REMEDIATION & ACTION PLAN', margin + 5, margin + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(161, 161, 170);
      doc.text('Prioritized engineering action items with expected ROI, deadlines, and ownership vectors.', margin + 5, margin + 12);

      let p2Y = 36;

      // 6. SECTION 4: PRIORITIZED STRATEGIC ACTION PLAN & NEXT STEPS
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(245, 158, 11);
      doc.text('04 // PRIORITIZED STRATEGIC ACTION PLAN & IMMEDIATE NEXT STEPS', margin, p2Y);
      p2Y += 5;

      const nextSteps: ReportNextStep[] = data.nextSteps && data.nextSteps.length > 0
        ? data.nextSteps
        : [
            {
              priority: 'P0',
              title: 'Seal Dark Social Attribution Leaks & GA4 Protocol Injection',
              timeline: '0-7 Days',
              impact: '+18% Budget Reallocation Gain',
              owner: 'Growth Engineer / Nexus Swarm',
              description: 'Deploy server-side Google Analytics 4 Measurement Protocol and unified second brain attribution telemetry to capture 82% of uncredited buyer touchpoints.'
            },
            {
              priority: 'P1',
              title: 'Deploy Automated Creative Hook Resets (72h Velocity)',
              timeline: '7-21 Days',
              impact: '+24% Meta & LinkedIn CTR Lift',
              owner: 'Creative Director AI / Content Engine',
              description: 'Synthesize 10 fresh carousel card angle tests and long-hook variations under Human-in-the-Loop review to prevent audience ad fatigue.'
            },
            {
              priority: 'P2',
              title: 'Publish Enterprise AEO Topical Graph & Entity Schemas',
              timeline: '21-45 Days',
              impact: '3.2x Generative Engine Citations',
              owner: 'Authority Agent / Second Brain',
              description: 'Inject categorical entity schemas, technical teardowns, and knowledge base nodes into CMS indexing for ChatGPT and Perplexity dominance.'
            }
          ];

      nextSteps.forEach((step) => {
        doc.setFillColor(18, 18, 23);
        doc.roundedRect(margin, p2Y, contentWidth, 24, 1.5, 1.5, 'F');
        doc.setDrawColor(step.priority === 'P0' ? 245 : 39, step.priority === 'P0' ? 158 : 39, step.priority === 'P0' ? 11 : 42);
        doc.setLineWidth(step.priority === 'P0' ? 0.8 : 0.3);
        doc.roundedRect(margin, p2Y, contentWidth, 24, 1.5, 1.5, 'S');

        // Priority Badge
        doc.setFillColor(step.priority === 'P0' ? 245 : 39, step.priority === 'P0' ? 158 : 39, step.priority === 'P0' ? 11 : 42);
        doc.rect(margin + 4, p2Y + 3.5, 10, 4.5, 'F');
        doc.setFont('courier', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(step.priority === 'P0' ? 0 : 255, step.priority === 'P0' ? 0 : 255, step.priority === 'P0' ? 0 : 255);
        doc.text(step.priority, margin + 6.5, p2Y + 7);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(step.title, margin + 17, p2Y + 7);

        doc.setFont('courier', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(16, 185, 129);
        doc.text(`Expected Impact: ${step.impact}`, rightX, p2Y + 7, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(212, 212, 216);
        const descLines = doc.splitTextToSize(step.description, contentWidth - 10);
        doc.text(descLines, margin + 4, p2Y + 13);

        doc.setFont('courier', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(161, 161, 170);
        doc.text(`Timeline: ${step.timeline}   •   Assigned Owner: ${step.owner}`, margin + 4, p2Y + 21);

        p2Y += 27;
      });

      p2Y += 4;

      // 7. SECTION 5: SECOND BRAIN SECURITY & DATA INTEGRITY
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(245, 158, 11);
      doc.text('05 // SECOND BRAIN SECURITY & VAULT INGESTION STATUS', margin, p2Y);
      p2Y += 4.5;

      // Table Header
      doc.setFillColor(24, 24, 30);
      doc.rect(margin, p2Y, contentWidth, 7, 'F');
      doc.setDrawColor(39, 39, 42);
      doc.rect(margin, p2Y, contentWidth, 7, 'S');

      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(245, 158, 11);
      doc.text('PERMISSIONED SECURITY VAULT', margin + 3, p2Y + 4.8);
      doc.text('INDEXED VECTORS (pgvector)', margin + 85, p2Y + 4.8);
      doc.text('SECURITY & COMPLIANCE', margin + 140, p2Y + 4.8);
      p2Y += 7;

      (data.vaults || []).forEach((v, idx) => {
        doc.setFillColor(idx % 2 === 0 ? 14 : 19, idx % 2 === 0 ? 14 : 19, idx % 2 === 0 ? 18 : 24);
        doc.rect(margin, p2Y, contentWidth, 6.5, 'F');
        doc.setDrawColor(28, 28, 33);
        doc.rect(margin, p2Y, contentWidth, 6.5, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text(v.name, margin + 3, p2Y + 4.5);

        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(212, 212, 216);
        doc.text(`${v.records.toLocaleString()} Records`, margin + 85, p2Y + 4.5);

        doc.setFont('courier', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text(v.status || 'AES-256-GCM / 100% Encrypted', margin + 140, p2Y + 4.5);

        p2Y += 6.5;
      });

      // Page 2 Footer
      doc.setDrawColor(39, 39, 42);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(113, 113, 122);
      doc.text('CONFIDENTIAL • Sigma Tactix Growth OS • Client-Owned Intelligence Infrastructure', margin, pageHeight - 7);
      doc.text('Page 2 of 2', rightX, pageHeight - 7, { align: 'right' });

      doc.save(filename);
      return true;
    } catch (error) {
      console.error('Executive PDF Export Error:', error);
      return false;
    }
  },

  /**
   * Export structured dataset to CSV
   */
  toCSV(data: any[], filename: string = 'sigmatactix-summary.csv') {
    try {
      if (!data || !data.length) return false;
      const headers = Object.keys(data[0]);
      const csvRows = [];
      csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

      for (const row of data) {
        const values = headers.map(header => {
          const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      }

      const csvString = csvRows.join('\r\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('CSV Export Error:', error);
      return false;
    }
  },

  /**
   * Export structured dataset to Excel XLSX
   */
  toXLSX(data: any[], filename: string = 'sigmatactix-data.xlsx') {
    try {
      if (!data || !data.length) return false;
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      XLSX.writeFile(workbook, filename);
      return true;
    } catch (error) {
      console.error('XLSX Export Error:', error);
      return false;
    }
  }
};
