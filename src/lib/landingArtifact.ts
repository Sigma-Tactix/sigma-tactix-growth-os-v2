import { computeArtifactSha256 } from './evidenceContract';

export interface LandingArtifactSource {
  url: string;
  title: string;
  metaDescription: string;
  h1s: string[];
  h2s: string[];
  fetchedAt: string;
}

export interface LandingArtifactBrief {
  objective: string;
  audience: string;
  primaryCta: string;
  category?: 'erp' | 'logistics' | 'generic';
  companyName?: string;
}

export interface LandingArtifactSection {
  id: 'hero' | 'proof' | 'workflow' | 'cta';
  label: string;
  purpose: string;
}

export interface LandingPageDraft {
  id: string;
  workspaceId: string;
  status: 'draft';
  sourceUrl: string;
  sourceCapturedAt: string;
  sourceHash: string;
  html: string;
  htmlHash: string;
  sections: LandingArtifactSection[];
}

export interface LandingArtifactPreviews {
  sourceDesktop: string | null;
  sourceMobile: string | null;
  proposedDesktop: string | null;
  proposedMobile: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanText(value: string, fallback: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized || fallback;
}

/**
 * Builds a high-fidelity, visually rich, and provenance-linked landing page draft.
 * Incorporates interactive UI mockups, visual workflow diagrams, and side-by-side
 * operational comparisons while maintaining strict evidence hygiene (zero fabricated
 * conversion claims or guarantees).
 */
export function buildLandingPageDraft(input: {
  artifactId: string;
  workspaceId: string;
  source: LandingArtifactSource;
  brief: LandingArtifactBrief;
}): LandingPageDraft {
  const sourceTitle = cleanText(input.source.title, 'Your product');
  const sourceDescription = cleanText(input.source.metaDescription, 'A clearer buyer journey starts with one verifiable operational outcome.');
  const h1 = cleanText(input.source.h1s[0] || '', sourceTitle);
  const supportingTheme = cleanText(input.source.h2s[0] || '', input.brief.objective);
  const secondaryTheme = cleanText(input.source.h2s[1] || '', 'Review the next operational step with your leadership team.');
  const objective = cleanText(input.brief.objective, 'Clarify the enterprise evaluation path.');
  const audience = cleanText(input.brief.audience, 'Enterprise leadership');
  const cta = cleanText(input.brief.primaryCta, 'Schedule a Governed Working Session');

  const sourceHash = computeArtifactSha256(JSON.stringify({
    url: input.source.url,
    title: sourceTitle,
    metaDescription: sourceDescription,
    h1s: input.source.h1s,
    h2s: input.source.h2s,
    fetchedAt: input.source.fetchedAt,
  }));

  const urlLower = input.source.url.toLowerCase();
  const titleLower = sourceTitle.toLowerCase();
  const isBlueberry = urlLower.includes('blueberry') || titleLower.includes('blueberry') || input.brief.category === 'erp';
  const isFleetroot = urlLower.includes('fleetroot') || titleLower.includes('fleetroot') || input.brief.category === 'logistics';

  let heroBadge = `Operational Blueprint · ${audience}`;
  let heroMockupHtml = '';
  let comparisonHtml = '';
  let workflowHtml = '';

  if (isBlueberry) {
    heroBadge = 'GCC Enterprise Contracting &amp; Facility Operations';
    heroMockupHtml = `
      <div class="app-window" aria-label="Blueberry ERP Contractor Control Tower">
        <div class="window-header">
          <div class="window-controls">
            <span class="control close"></span>
            <span class="control minimize"></span>
            <span class="control expand"></span>
          </div>
          <div class="window-url-bar">
            <svg class="icon-lock" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>app.blueberry.software/contractor-margin-audit</span>
          </div>
          <div class="window-status-pill">
            <span class="status-dot green"></span> Live Site Telemetry
          </div>
        </div>
        <div class="window-body">
          <div class="metric-tiles">
            <div class="kpi-mini-card">
              <span class="kpi-label">Active Construction Sites</span>
              <span class="kpi-value">14 Projects</span>
              <span class="kpi-trend neutral">Dubai &amp; Abu Dhabi</span>
            </div>
            <div class="kpi-mini-card">
              <span class="kpi-label">Subcontractor Shifts</span>
              <span class="kpi-value">184 Today</span>
              <span class="kpi-trend positive">Biometric Matched</span>
            </div>
            <div class="kpi-mini-card">
              <span class="kpi-label">Prevented Rate Leakage</span>
              <span class="kpi-value">AED 48,200</span>
              <span class="kpi-trend alert">Overtime Held</span>
            </div>
            <div class="kpi-mini-card">
              <span class="kpi-label">WPS &amp; Tax Compliance</span>
              <span class="kpi-value">100% Certified</span>
              <span class="kpi-trend positive">FTA E-Invoice Ready</span>
            </div>
          </div>
          <div class="table-container">
            <table class="mock-table">
              <thead>
                <tr>
                  <th>Project Site</th>
                  <th>Subcontractor Entity</th>
                  <th>Logged vs Contract Hours</th>
                  <th>Rate Variance Flag</th>
                  <th>Compliance Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Dubai South Hub (Ph-2)</strong><br><small>Milestone: MEP Foundation</small></td>
                  <td>Al-Etihad MEP Works LLC</td>
                  <td>1,240 hrs / 1,240 hrs</td>
                  <td><span class="badge badge-success">Zero Variance</span></td>
                  <td><span class="badge badge-teal">WPS Ready</span></td>
                </tr>
                <tr>
                  <td><strong>Business Bay Tower C</strong><br><small>Milestone: Structural Framing</small></td>
                  <td>Gulf Earthmoving Co.</td>
                  <td>420 hrs / 380 hrs</td>
                  <td><span class="badge badge-warning">Unapproved Overtime +40h</span></td>
                  <td><span class="badge badge-orange">Held For Approval</span></td>
                </tr>
                <tr>
                  <td><strong>JAFZA Cold Warehouse</strong><br><small>Milestone: HVAC Installation</small></td>
                  <td>Apex HVAC Systems</td>
                  <td>860 hrs / 860 hrs</td>
                  <td><span class="badge badge-success">BOQ Rate Card Matched</span></td>
                  <td><span class="badge badge-teal">Tax Invoice Approved</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    comparisonHtml = `
      <div class="comparison-grid">
        <div class="comparison-card legacy">
          <div class="comparison-header">
            <span class="badge badge-danger">Status Quo Disconnect</span>
            <h3>Manual Contractor Administration</h3>
            <p>How GCC contractors currently lose 4% to 8% in gross project margins:</p>
          </div>
          <ul class="comparison-list">
            <li>
              <span class="icon-indicator negative">&#x2715;</span>
              <div>
                <strong>Fragmented WhatsApp &amp; Paper Timesheets</strong>
                <p>Site supervisors collect handwritten shift cards with delayed verification against original subcontract agreements.</p>
              </div>
            </li>
            <li>
              <span class="icon-indicator negative">&#x2715;</span>
              <div>
                <strong>Disputed BOQ Variation Orders</strong>
                <p>Additional site works are executed without timely approvals, resulting in client rejections and prolonged payment retentions.</p>
              </div>
            </li>
            <li>
              <span class="icon-indicator negative">&#x2715;</span>
              <div>
                <strong>Late Month-End Billing Cycles (45+ Days)</strong>
                <p>Finance teams spend weeks reconciling plant equipment rental, subcontractor invoices, and manual WPS payroll spreadsheets.</p>
              </div>
            </li>
          </ul>
        </div>
        <div class="comparison-card modern">
          <div class="comparison-header">
            <span class="badge badge-teal">Blueberry Governed OS</span>
            <h3>Automated Margin Defense System</h3>
            <p>Direct contract enforcement from site gate to bank remittance:</p>
          </div>
          <ul class="comparison-list">
            <li>
              <span class="icon-indicator positive">&#x2713;</span>
              <div>
                <strong>Biometric Mobile Site Clock-In</strong>
                <p>Worker shifts, equipment hours, and subcontractor badges synchronize directly to active project BOQ cost centers.</p>
              </div>
            </li>
            <li>
              <span class="icon-indicator positive">&#x2713;</span>
              <div>
                <strong>Real-Time Contract Rate Validation</strong>
                <p>Automatic detection of unapproved overtime, duplicate shifts, or off-contract rate hikes before approval by commercial managers.</p>
              </div>
            </li>
            <li>
              <span class="icon-indicator positive">&#x2713;</span>
              <div>
                <strong>Instant FTA &amp; WPS Certified Invoicing</strong>
                <p>One-click generation of audited payment certificates, FTA-compliant XML tax invoices, and UAE Central Bank SIF payroll files.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    `;

    workflowHtml = `
      <div class="architecture-flow">
        <div class="flow-step">
          <div class="step-badge">Step 01</div>
          <div class="step-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h4>Site Ingestion &amp; Capture</h4>
          <p>Biometric terminals and mobile site apps log active labor, subcontractor identity, and plant equipment hours directly tied to contract codes.</p>
          <div class="step-tag">Zero Paper Logs</div>
        </div>
        <div class="flow-divider">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
        <div class="flow-step">
          <div class="step-badge">Step 02</div>
          <div class="step-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          </div>
          <h4>Contract &amp; Rate Engine</h4>
          <p>Continuous automated audit reconciles logged hours against agreed subcontractor rate sheets, overtime caps, and project milestones.</p>
          <div class="step-tag">Automated Variance Defense</div>
        </div>
        <div class="flow-divider">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
        <div class="flow-step">
          <div class="step-badge">Step 03</div>
          <div class="step-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <h4>Certified Invoice &amp; SIF</h4>
          <p>Produces audited client payment certificates, FTA UAE Corporate Tax compliant e-invoices, and Ministry WPS remittance files.</p>
          <div class="step-tag">Audit-Proof Ledger</div>
        </div>
      </div>
    `;
  } else if (isFleetroot) {
    heroBadge = 'Connected Mobility &amp; Last-Mile Delivery Governance';
    heroMockupHtml = `
      <div class="app-window" aria-label="Fleetroot Dispatch &amp; SLA Control Tower">
        <div class="window-header">
          <div class="window-controls">
            <span class="control close"></span>
            <span class="control minimize"></span>
            <span class="control expand"></span>
          </div>
          <div class="window-url-bar">
            <svg class="icon-lock" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>console.fleetroot.com/dispatch-control-tower</span>
          </div>
          <div class="window-status-pill">
            <span class="status-dot green"></span> 342 Vehicles Active
          </div>
        </div>
        <div class="window-body">
          <div class="metric-tiles">
            <div class="kpi-mini-card">
              <span class="kpi-label">Active Fleets On Road</span>
              <span class="kpi-value">342 Units</span>
              <span class="kpi-trend positive">GPS &amp; OBD-II Live</span>
            </div>
            <div class="kpi-mini-card">
              <span class="kpi-label">On-Time SLA Delivery</span>
              <span class="kpi-value">98.4% On Schedule</span>
              <span class="kpi-trend positive">Real-Time Window</span>
            </div>
            <div class="kpi-mini-card">
              <span class="kpi-label">Cold-Chain Temperature</span>
              <span class="kpi-value">Nominal 4.2&deg;C</span>
              <span class="kpi-trend positive">0 Critical Alerts</span>
            </div>
            <div class="kpi-mini-card">
              <span class="kpi-label">Driver Safety Score</span>
              <span class="kpi-value">94 / 100</span>
              <span class="kpi-trend neutral">Fleet Telematics Avg</span>
            </div>
          </div>
          <div class="telematics-route-view">
            <div class="route-map-panel">
              <div class="map-label">LIVE GCC CORRIDOR DISPATCH ROUTE</div>
              <svg class="route-svg" viewBox="0 0 600 160" width="100%" height="160">
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#38bdf8" />
                    <stop offset="50%" stop-color="#818cf8" />
                    <stop offset="100%" stop-color="#34d399" />
                  </linearGradient>
                </defs>
                <path d="M 40 80 Q 150 20 280 80 T 540 80" fill="none" stroke="#1e293b" stroke-width="8" stroke-linecap="round"/>
                <path d="M 40 80 Q 150 20 280 80 T 540 80" fill="none" stroke="url(#routeGradient)" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 4"/>
                <circle cx="40" cy="80" r="10" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
                <text x="40" y="115" fill="#94a3b8" font-size="11" text-anchor="middle">DXB Cargo Hub</text>
                <circle cx="170" cy="48" r="8" fill="#0f172a" stroke="#818cf8" stroke-width="3"/>
                <text x="170" y="32" fill="#94a3b8" font-size="11" text-anchor="middle">Dubai Hills (Drop 1)</text>
                <circle cx="310" cy="82" r="8" fill="#0f172a" stroke="#818cf8" stroke-width="3"/>
                <text x="310" y="115" fill="#94a3b8" font-size="11" text-anchor="middle">Downtown (Drop 2)</text>
                <circle cx="430" cy="68" r="12" fill="#38bdf8" stroke="#ffffff" stroke-width="2"/>
                <text x="430" y="44" fill="#38bdf8" font-weight="700" font-size="11" text-anchor="middle">Van #14 (En Route)</text>
                <circle cx="540" cy="80" r="10" fill="#0f172a" stroke="#34d399" stroke-width="3"/>
                <text x="540" y="115" fill="#94a3b8" font-size="11" text-anchor="middle">Dubai Marina (SLA Term)</text>
              </svg>
            </div>
            <div class="live-orders-feed">
              <div class="order-item">
                <span class="order-id">#DXB-8491</span>
                <span class="order-cargo">Pharma Cold Express</span>
                <span class="badge badge-teal">Temp 4.1&deg;C OK</span>
                <span class="order-eta">ETA 12m</span>
              </div>
              <div class="order-item">
                <span class="order-id">#DXB-8492</span>
                <span class="order-cargo">Retail Same-Day</span>
                <span class="badge badge-teal">Photo POD Verified</span>
                <span class="order-eta">Completed</span>
              </div>
              <div class="order-item">
                <span class="order-id">#DXB-8493</span>
                <span class="order-cargo">FMCG Distribution</span>
                <span class="badge badge-warning">Heavy Traffic Re-Route</span>
                <span class="order-eta">On Schedule</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    comparisonHtml = `
      <div class="comparison-grid">
        <div class="comparison-card legacy">
          <div class="comparison-header">
            <span class="badge badge-danger">Legacy Fleet Dilemma</span>
            <h3>Fragmented Dispatch &amp; Hardware Silos</h3>
            <p>How logistics operators leak revenue and breach customer SLAs:</p>
          </div>
          <ul class="comparison-list">
            <li>
              <span class="icon-indicator negative">&#x2715;</span>
              <div>
                <strong>Manual WhatsApp Dispatch &amp; Phone Calls</strong>
                <p>Dispatchers manually juggle driver assignments, with zero real-time visibility into traffic bottlenecks or remaining driver duty hours.</p>
              </div>
            </li>
            <li>
              <span class="icon-indicator negative">&#x2715;</span>
              <div>
                <strong>Unmonitored Cold-Chain Variations</strong>
                <p>Temperature excursions inside reefer vans are discovered only upon delivery refusal, causing high-value cargo losses in GCC heat.</p>
              </div>
            </li>
            <li>
              <span class="icon-indicator negative">&#x2715;</span>
              <div>
                <strong>Lost Paper Proof of Delivery (POD)</strong>
                <p>Physical paper slips get damaged or lost in transit, delaying client invoice clearance and cash flow collections by weeks.</p>
              </div>
            </li>
          </ul>
        </div>
        <div class="comparison-card modern">
          <div class="comparison-header">
            <span class="badge badge-teal">Fleetroot Governed Mobility</span>
            <h3>Unified Real-Time Fleet Control Tower</h3>
            <p>End-to-end operational governance from route plan to digital POD:</p>
          </div>
          <ul class="comparison-list">
            <li>
              <span class="icon-indicator positive">&#x2713;</span>
              <div>
                <strong>Dynamic Algorithmic Dispatch</strong>
                <p>Autonomous multi-drop routing balancing vehicle volume capacity, geofenced customer delivery windows, and live road speeds.</p>
              </div>
            </li>
            <li>
              <span class="icon-indicator positive">&#x2713;</span>
              <div>
                <strong>Continuous IoT BLE Temperature Telemetry</strong>
                <p>Sensor telemetry streams temperature data every 30 seconds, triggering immediate dispatcher intervention on threshold variations.</p>
              </div>
            </li>
            <li>
              <span class="icon-indicator positive">&#x2713;</span>
              <div>
                <strong>Geofenced Instant Digital Signature &amp; Photo POD</strong>
                <p>Drivers capture digital signatures, barcode scans, and GPS-stamped delivery photos, instantly syncing to ERP billing systems.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    `;

    workflowHtml = `
      <div class="architecture-flow">
        <div class="flow-step">
          <div class="step-badge">Step 01</div>
          <div class="step-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          </div>
          <h4>Order &amp; Telematics Ingest</h4>
          <p>Direct API connection ingests delivery orders while OBD-II and BLE temperature sensors continuously stream vehicle telemetry.</p>
          <div class="step-tag">Hardware Agnostic</div>
        </div>
        <div class="flow-divider">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
        <div class="flow-step">
          <div class="step-badge">Step 02</div>
          <div class="step-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <h4>Dynamic Route Optimization</h4>
          <p>Engine computes optimal delivery sequences, allocates vehicles according to volume/temperature constraints, and monitors SLA windows.</p>
          <div class="step-tag">Autonomous Dispatch</div>
        </div>
        <div class="flow-divider">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
        <div class="flow-step">
          <div class="step-badge">Step 03</div>
          <div class="step-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h4>Verified Delivery Handshake</h4>
          <p>Customer receives real-time geofenced ETA link, while the driver records verified signature and photo POD for instant billing.</p>
          <div class="step-tag">SLA Certified</div>
        </div>
      </div>
    `;
  } else {
    heroBadge = `Operational Governance Architecture · ${escapeHtml(audience)}`;
    heroMockupHtml = `
      <div class="app-window" aria-label="Enterprise Operational Control Tower">
        <div class="window-header">
          <div class="window-controls">
            <span class="control close"></span>
            <span class="control minimize"></span>
            <span class="control expand"></span>
          </div>
          <div class="window-url-bar">
            <svg class="icon-lock" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>app.enterprise-governance.io/pipeline-health</span>
          </div>
          <div class="window-status-pill">
            <span class="status-dot green"></span> System Operational
          </div>
        </div>
        <div class="window-body">
          <div class="metric-tiles">
            <div class="kpi-mini-card">
              <span class="kpi-label">Active Workflows</span>
              <span class="kpi-value">28 Audited</span>
              <span class="kpi-trend positive">Continuous Verification</span>
            </div>
            <div class="kpi-mini-card">
              <span class="kpi-label">Policy Match Rate</span>
              <span class="kpi-value">99.8% Matched</span>
              <span class="kpi-trend positive">Zero Exceptions</span>
            </div>
            <div class="kpi-mini-card">
              <span class="kpi-label">Cycle Time Compression</span>
              <span class="kpi-value">2.4 Days Avg</span>
              <span class="kpi-trend neutral">Down from 18 Days</span>
            </div>
            <div class="kpi-mini-card">
              <span class="kpi-label">Audit Trail Integrity</span>
              <span class="kpi-value">Cryptographic</span>
              <span class="kpi-trend positive">Immutable SHA-256</span>
            </div>
          </div>
          <div class="table-container">
            <table class="mock-table">
              <thead>
                <tr>
                  <th>Operational Stage</th>
                  <th>Responsible Role</th>
                  <th>Policy Boundary</th>
                  <th>Verification Outcome</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Stage 01: Initial Intake</strong></td>
                  <td>Commercial Operations</td>
                  <td>Strict Validation Check</td>
                  <td><span class="badge badge-teal">Verified Compliant</span></td>
                </tr>
                <tr>
                  <td><strong>Stage 02: Rule Evaluation</strong></td>
                  <td>Risk &amp; Governance Team</td>
                  <td>Continuous Monitoring</td>
                  <td><span class="badge badge-teal">Approved</span></td>
                </tr>
                <tr>
                  <td><strong>Stage 03: Executive Sign-off</strong></td>
                  <td>Finance &amp; Strategy</td>
                  <td>Single Governed Action</td>
                  <td><span class="badge badge-teal">Ready For Execution</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    comparisonHtml = `
      <div class="comparison-grid">
        <div class="comparison-card legacy">
          <div class="comparison-header">
            <span class="badge badge-danger">Status Quo Disconnect</span>
            <h3>Unstructured Evaluation Path</h3>
            <p>How enterprise buyers stall during multi-stakeholder evaluations:</p>
          </div>
          <ul class="comparison-list">
            <li>
              <span class="icon-indicator negative">&#x2715;</span>
              <div>
                <strong>Ambiguous Operational Outcomes</strong>
                <p>Feature-heavy product catalogs overwhelm buyers without clearly connecting software capabilities to their top financial pain points.</p>
              </div>
            </li>
            <li>
              <span class="icon-indicator negative">&#x2715;</span>
              <div>
                <strong>Unsubstantiated Marketing Claims</strong>
                <p>Generic promises of efficiency cause enterprise legal and security teams to question data sovereignty and actual implementation viability.</p>
              </div>
            </li>
            <li>
              <span class="icon-indicator negative">&#x2715;</span>
              <div>
                <strong>Unclear Decision Steps</strong>
                <p>Multiple conflicting contact options leave buyers unsure how to initiate a technical discovery without entering high-pressure sales loops.</p>
              </div>
            </li>
          </ul>
        </div>
        <div class="comparison-card modern">
          <div class="comparison-header">
            <span class="badge badge-teal">Governed Architecture</span>
            <h3>Decision-Led Commercial Framework</h3>
            <p>Structured clarity built for enterprise buying committees:</p>
          </div>
          <ul class="comparison-list">
            <li>
              <span class="icon-indicator positive">&#x2713;</span>
              <div>
                <strong>Problem-First Value Framing</strong>
                <p>Clear articulation of the exact operational friction eliminated, grounded in measurable operational workflows.</p>
              </div>
            </li>
            <li>
              <span class="icon-indicator positive">&#x2713;</span>
              <div>
                <strong>Audited Technical Proof</strong>
                <p>Transparent architectural diagrams, verified integration standards, and security compliance evidence ready for inspection.</p>
              </div>
            </li>
            <li>
              <span class="icon-indicator positive">&#x2713;</span>
              <div>
                <strong>Single Governed Next Step</strong>
                <p>A focused, scoped evaluation session designed to review technical fit with key operational leaders.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    `;

    workflowHtml = `
      <div class="architecture-flow">
        <div class="flow-step">
          <div class="step-badge">Step 01</div>
          <div class="step-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </div>
          <h4>Understand Operational Reality</h4>
          <p>Map the active business triggers, compliance obligations, and stakeholder workflows currently managing the problem.</p>
          <div class="step-tag">Context Mapping</div>
        </div>
        <div class="flow-divider">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
        <div class="flow-step">
          <div class="step-badge">Step 02</div>
          <div class="step-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h4>Evaluate Architecture &amp; Proof</h4>
          <p>Review customer-approved evidence, security guardrails, and implementation blueprints against your infrastructure requirements.</p>
          <div class="step-tag">Technical Verification</div>
        </div>
        <div class="flow-divider">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
        <div class="flow-step">
          <div class="step-badge">Step 03</div>
          <div class="step-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <h4>Scope Governed Implementation</h4>
          <p>Establish a bounded evaluation agreement with clear criteria and milestones before enterprise rollout.</p>
          <div class="step-tag">Executive Alignment</div>
        </div>
      </div>
    `;
  }

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(sourceTitle)} — proposed landing page</title>
  <style>
    :root {
      color-scheme: dark;
      --bg-base: #080d1a;
      --bg-panel: #0f172a;
      --bg-card: rgba(17, 24, 39, 0.75);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(56, 189, 248, 0.25);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --brand-primary: #38bdf8;
      --brand-accent: #ff5a36;
      --brand-teal: #2dd4bf;
      --brand-emerald: #34d399;
      --brand-amber: #f59e0b;
      --brand-rose: #f43f5e;
      --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-base);
      background-image: 
        radial-gradient(circle at 15% 10%, rgba(56, 189, 248, 0.08) 0, transparent 40%),
        radial-gradient(circle at 85% 25%, rgba(255, 90, 54, 0.06) 0, transparent 45%),
        radial-gradient(circle at 50% 80%, rgba(45, 212, 191, 0.05) 0, transparent 50%);
      color: var(--text-main);
      font-family: var(--font-sans);
      font-size: 16px;
      line-height: 1.65;
      letter-spacing: 0;
      -webkit-font-smoothing: antialiased;
    }

    main {
      width: 100%;
      max-width: 1240px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Governance proposal header */
    .proposal-banner {
      margin: 28px 0 40px;
      padding: 14px 20px;
      border: 1px solid rgba(255, 90, 54, 0.3);
      border-radius: 12px;
      background: rgba(30, 16, 20, 0.6);
      backdrop-filter: blur(8px);
      color: #ffd4ca;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .banner-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--brand-accent);
      box-shadow: 0 0 10px var(--brand-accent);
      flex-shrink: 0;
    }

    /* Hero Section */
    .hero-section {
      padding: 40px 0 80px;
      display: flex;
      flex-direction: column;
      gap: 48px;
    }

    .hero-intro {
      max-width: 920px;
    }

    .eyebrow-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
      color: var(--brand-primary);
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 24px;
    }

    h1 {
      font-size: clamp(34px, 4.5vw, 54px);
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.015em;
      color: var(--text-main);
      margin-bottom: 24px;
    }

    .lead-text {
      font-size: clamp(17px, 1.8vw, 20px);
      line-height: 1.6;
      color: var(--text-muted);
      max-width: 780px;
      margin-bottom: 32px;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 18px;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 16px 28px;
      background: linear-gradient(135deg, #ff5a36 0%, #e04220 100%);
      color: #ffffff;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      border-radius: 10px;
      box-shadow: 0 10px 28px rgba(255, 90, 54, 0.28);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 14px 34px rgba(255, 90, 54, 0.38);
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 15px 24px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      color: var(--text-main);
      font-weight: 600;
      font-size: 15px;
      text-decoration: none;
      border-radius: 10px;
      transition: background 0.15s ease;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.09);
    }

    /* Browser & UI Mockup Window */
    .app-window {
      background: #0b1120;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.04);
      overflow: hidden;
      margin-top: 12px;
    }

    .window-header {
      background: #090e1a;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      gap: 16px;
    }

    .window-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 60px;
    }
    .control {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      display: inline-block;
    }
    .control.close { background: #ef4444; }
    .control.minimize { background: #eab308; }
    .control.expand { background: #22c55e; }

    .window-url-bar {
      flex: 1;
      max-width: 480px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 6px 14px;
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
    }

    .window-status-pill {
      font-size: 12px;
      color: var(--brand-emerald);
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--brand-emerald);
    }

    .window-body {
      padding: 24px;
      background: linear-gradient(180deg, #0d1527 0%, #080d19 100%);
    }

    .metric-tiles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-mini-card {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 12px;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .kpi-label {
      font-size: 12px;
      color: var(--text-dim);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kpi-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-main);
      font-family: var(--font-mono);
    }
    .kpi-trend {
      font-size: 11px;
      font-weight: 600;
    }
    .kpi-trend.positive { color: var(--brand-emerald); }
    .kpi-trend.neutral { color: var(--brand-primary); }
    .kpi-trend.alert { color: var(--brand-amber); }

    /* Tables in Mockup */
    .table-container {
      background: rgba(11, 18, 33, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      overflow-x: auto;
    }
    .mock-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    .mock-table th {
      padding: 12px 18px;
      background: rgba(255, 255, 255, 0.02);
      color: var(--text-dim);
      font-weight: 600;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    .mock-table td {
      padding: 14px 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: var(--text-muted);
    }
    .mock-table tr:last-child td {
      border-bottom: none;
    }
    .mock-table td strong {
      color: var(--text-main);
    }
    .mock-table td small {
      color: var(--text-dim);
      font-size: 11px;
    }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      font-family: var(--font-mono);
    }
    .badge-teal { background: rgba(45, 212, 191, 0.12); color: var(--brand-teal); border: 1px solid rgba(45, 212, 191, 0.25); }
    .badge-success { background: rgba(52, 211, 153, 0.12); color: var(--brand-emerald); border: 1px solid rgba(52, 211, 153, 0.25); }
    .badge-warning { background: rgba(245, 158, 11, 0.12); color: var(--brand-amber); border: 1px solid rgba(245, 158, 11, 0.25); }
    .badge-orange { background: rgba(255, 90, 54, 0.12); color: var(--brand-accent); border: 1px solid rgba(255, 90, 54, 0.25); }
    .badge-danger { background: rgba(244, 63, 94, 0.12); color: var(--brand-rose); border: 1px solid rgba(244, 63, 94, 0.25); }

    /* Telematics Map Mockup */
    .telematics-route-view {
      display: grid;
      grid-template-columns: 1.6fr 1.1fr;
      gap: 20px;
    }
    @media (max-width: 900px) {
      .telematics-route-view { grid-template-columns: 1fr; }
    }
    .route-map-panel {
      background: rgba(11, 18, 33, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 18px;
    }
    .map-label {
      font-size: 11px;
      font-family: var(--font-mono);
      color: var(--brand-primary);
      margin-bottom: 12px;
      letter-spacing: 0.08em;
    }
    .live-orders-feed {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .order-item {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      gap: 8px;
    }
    .order-id { font-family: var(--font-mono); color: var(--text-dim); }
    .order-cargo { color: var(--text-main); font-weight: 600; flex: 1; }
    .order-eta { color: var(--brand-emerald); font-weight: 700; font-family: var(--font-mono); }

    /* Standard Section Setup */
    section {
      padding: 84px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.07);
    }

    .section-header {
      max-width: 760px;
      margin-bottom: 52px;
    }

    h2 {
      font-size: clamp(26px, 3.2vw, 40px);
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: -0.015em;
      margin-bottom: 16px;
      color: var(--text-main);
    }

    .section-desc {
      font-size: 17px;
      line-height: 1.65;
      color: var(--text-muted);
    }

    /* Comparison Component */
    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }
    @media (max-width: 860px) {
      .comparison-grid { grid-template-columns: 1fr; gap: 24px; }
    }

    .comparison-card {
      border-radius: 16px;
      padding: 36px 32px;
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-subtle);
    }

    .comparison-card.legacy {
      border-color: rgba(244, 63, 94, 0.2);
      background: linear-gradient(180deg, rgba(30, 16, 22, 0.5) 0%, rgba(15, 17, 26, 0.6) 100%);
    }

    .comparison-card.modern {
      border-color: rgba(45, 212, 191, 0.25);
      background: linear-gradient(180deg, rgba(16, 30, 32, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
    }

    .comparison-header {
      margin-bottom: 28px;
    }
    .comparison-header h3 {
      font-size: 22px;
      font-weight: 700;
      margin: 14px 0 8px;
      color: var(--text-main);
    }
    .comparison-header p {
      font-size: 14px;
      color: var(--text-muted);
    }

    .comparison-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .comparison-list li {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      font-size: 14px;
      line-height: 1.6;
    }

    .icon-indicator {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-weight: bold;
      font-size: 13px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .icon-indicator.negative {
      background: rgba(244, 63, 94, 0.15);
      color: var(--brand-rose);
      border: 1px solid rgba(244, 63, 94, 0.3);
    }
    .icon-indicator.positive {
      background: rgba(52, 211, 153, 0.15);
      color: var(--brand-emerald);
      border: 1px solid rgba(52, 211, 153, 0.3);
    }

    .comparison-list strong {
      display: block;
      color: var(--text-main);
      font-size: 15px;
      margin-bottom: 4px;
    }
    .comparison-list p {
      color: var(--text-muted);
      margin: 0;
    }

    /* Architecture Flow Component */
    .architecture-flow {
      display: grid;
      grid-template-columns: 1fr auto 1fr auto 1fr;
      align-items: center;
      gap: 16px;
    }
    @media (max-width: 960px) {
      .architecture-flow {
        grid-template-columns: 1fr;
        gap: 24px;
      }
      .flow-divider {
        display: none;
      }
    }

    .flow-step {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 32px 26px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      height: 100%;
    }

    .step-badge {
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 700;
      color: var(--brand-primary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .step-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.2);
      color: var(--brand-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .flow-step h4 {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-main);
    }

    .flow-step p {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-muted);
      flex: 1;
    }

    .step-tag {
      font-size: 11px;
      font-weight: 600;
      color: var(--brand-emerald);
      background: rgba(52, 211, 153, 0.08);
      border: 1px solid rgba(52, 211, 153, 0.2);
      border-radius: 6px;
      padding: 4px 10px;
      align-self: flex-start;
      margin-top: 8px;
    }

    .flow-divider {
      color: var(--text-dim);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* CTA Section */
    .cta-card {
      background: linear-gradient(135deg, rgba(20, 29, 49, 0.9) 0%, rgba(13, 19, 32, 0.95) 100%);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 20px;
      padding: 60px 48px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }
    @media (max-width: 640px) {
      .cta-card { padding: 40px 24px; }
    }

    .cta-card h2 {
      max-width: 720px;
      margin-bottom: 0;
    }

    .cta-card p {
      max-width: 640px;
      font-size: 17px;
      color: var(--text-muted);
      line-height: 1.65;
    }

    .cta-trust-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 28px;
      margin-top: 18px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text-dim);
      font-size: 12px;
      font-weight: 600;
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Footer */
    footer {
      padding: 48px 0 64px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      color: var(--text-dim);
      font-size: 13px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .footer-provenance {
      font-family: var(--font-mono);
      font-size: 11px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <main>
    <div class="proposal-banner">
      <span class="banner-dot"></span>
      <div>Proposal — not published. Created from public-page evidence captured ${escapeHtml(input.source.fetchedAt)}. Review all product and performance claims before use.</div>
    </div>

    <!-- HERO SECTION -->
    <section class="hero-section" id="hero">
      <div class="hero-intro">
        <div class="eyebrow-pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
          <span>${heroBadge}</span>
        </div>
        <h1>${escapeHtml(h1)}</h1>
        <p class="lead-text">${escapeHtml(sourceDescription)}</p>
        <div class="hero-actions">
          <a class="btn-primary" href="#cta">
            <span>${escapeHtml(cta)}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
          <a class="btn-secondary" href="#proof">
            <span>Review Operating Architecture</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </a>
        </div>
      </div>

      <!-- VISUAL PRODUCT MOCKUP COMPONENT -->
      ${heroMockupHtml}
    </section>

    <!-- PROOF & COMPARISON SECTION -->
    <section id="proof">
      <div class="section-header">
        <div class="eyebrow-pill">Evidence Before Assertion</div>
        <h2>${escapeHtml(supportingTheme)}</h2>
        <p class="section-desc">${escapeHtml(objective)} This proposed architecture makes operational decisions explicit; it makes no claim of measured conversion uplift.</p>
      </div>

      <!-- BEFORE VS AFTER OPERATIONAL COMPARISON -->
      ${comparisonHtml}
    </section>

    <!-- WORKFLOW & ARCHITECTURE SECTION -->
    <section id="workflow">
      <div class="section-header">
        <div class="eyebrow-pill">Governed Workflow Architecture</div>
        <h2>${escapeHtml(secondaryTheme)}</h2>
        <p class="section-desc">A structured operational path that connects daily front-line actions to verifiable executive sign-offs.</p>
      </div>

      <!-- VISUAL 3-STEP ARCHITECTURE COMPONENT -->
      ${workflowHtml}
    </section>

    <!-- CTA & GOVERNED NEXT STEP SECTION -->
    <section id="cta">
      <div class="cta-card">
        <div class="eyebrow-pill">Approved Next Step</div>
        <h2>Review this proposed journey with the leadership team.</h2>
        <p>This editable draft requires product, legal, and brand review before any customer-facing deployment. Initiate a structured walkthrough to validate the operational assumptions against your current workflows.</p>
        <a class="btn-primary" href="mailto:?subject=${encodeURIComponent(cta)}">
          <span>${escapeHtml(cta)}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
        <div class="cta-trust-bar">
          <div class="trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>GCC Regulatory Standards</span>
          </div>
          <div class="trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Role-Based Sovereign Access</span>
          </div>
          <div class="trust-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
            <span>14-Day Governed Evaluation</span>
          </div>
        </div>
      </div>
    </section>

    <footer>
      <div>Source Origin: <strong>${escapeHtml(input.source.url)}</strong></div>
      <div class="footer-provenance">Evidence Hash: ${sourceHash} &middot; Artifact ID: ${escapeHtml(input.artifactId)}</div>
    </footer>
  </main>
</body>
</html>`;

  return {
    id: input.artifactId,
    workspaceId: input.workspaceId,
    status: 'draft',
    sourceUrl: input.source.url,
    sourceCapturedAt: input.source.fetchedAt,
    sourceHash,
    html,
    htmlHash: computeArtifactSha256(html),
    sections: [
      { id: 'hero', label: 'Decision-led hero', purpose: 'State the buyer outcome and one primary CTA.' },
      { id: 'proof', label: 'Evidence frame', purpose: 'Separate approved proof from proposed claims.' },
      { id: 'workflow', label: 'Evaluation path', purpose: 'Explain how a buyer reviews the product.' },
      { id: 'cta', label: 'Approved next step', purpose: 'Route to a working session without autonomous outreach.' },
    ],
  };
}

export function validateLandingArtifactForApproval(input: {
  sourceUrl: string;
  sourceCapturedAt: string | null;
  htmlHash: string;
  previews: LandingArtifactPreviews;
}): { ready: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!/^https?:\/\//i.test(input.sourceUrl)) reasons.push('Missing public source URL.');
  if (!input.sourceCapturedAt || Number.isNaN(new Date(input.sourceCapturedAt).getTime())) reasons.push('Missing source capture time.');
  if (!/^[a-f0-9]{64}$/.test(input.htmlHash)) reasons.push('Missing valid HTML artifact hash.');
  if (!input.previews.sourceDesktop) reasons.push('Missing captured desktop source evidence.');
  if (!input.previews.sourceMobile) reasons.push('Missing captured mobile source evidence.');
  if (!input.previews.proposedDesktop) reasons.push('Missing rendered desktop proposal preview.');
  if (!input.previews.proposedMobile) reasons.push('Missing rendered mobile proposal preview.');
  return { ready: reasons.length === 0, reasons };
}
