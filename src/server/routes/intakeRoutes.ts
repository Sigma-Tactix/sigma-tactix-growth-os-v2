import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { sendEmail } from '../../lib/email.js';
import type { WorkspaceData } from '../../types.js';

// ---------------------------------------------------------------------------
// OS onboarding (launch-intake) + the intake questionnaire. Launching intake
// writes the Second Brain vaults server-side, mints a real intake_tokens row
// and sends the onboarding email with a client-completable link; the
// questionnaire persists answers field-by-field into the vaults and reports
// exactly which fields landed where.
//
// Extracted from server.ts (P2 increment 12 of the router-extraction
// program, see docs/OPTIMIZATION_AUDIT.md). The REQUESTED_INTAKE_FIELDS
// const co-moves (region-local). Request-scoped getDB/saveDB are INJECTED —
// they stay in server.ts, which owns them; sendEmail (stable lib) imports
// directly. The PUBLIC token routes (/api/public/intake/:token and
// /:token/complete) are a different family (deferred pre-auth band) and do
// NOT move here. Mounted under /api/workspace AFTER the global
// app.use("/api/workspace", requireAuth), so auth + RLS semantics are
// unchanged.
// ---------------------------------------------------------------------------

export interface IntakeRouterDeps {
  getDB: (res: Response) => Promise<WorkspaceData>;
  saveDB: (res: Response, data: WorkspaceData) => Promise<void>;
}

export function createIntakeRouter(deps: IntakeRouterDeps): Router {
  const router = Router();
  const { getDB, saveDB } = deps;

// OS Simulation Center -> real (#14). "Launching" now: validates + writes
// the Second Brain vaults server-side (was: client-computed after a fake
// setTimeout log sequence), creates a real intake_tokens row, and sends a
// real templated onboarding email with a client-completable link — instead
// of only ever updating the agency's own view of the data.
const REQUESTED_INTAKE_FIELDS = ["Business address", "Logo upload", "Brand guidelines document", "Website admin credentials (read-only)"];

router.post('/launch-intake', async (req: Request, res: Response) => {
  const { clientEmail, brandName, slogan, audience, cmsType, channel } = req.body as {
    clientEmail?: string; brandName?: string; slogan?: string; audience?: string; cmsType?: string; channel?: string;
  };
  if (!clientEmail || !brandName) {
    res.status(400).json({ error: "Client email and brand name are required to launch intake." });
    return;
  }

  const db = await getDB(res);
  const steps: string[] = [];

  db.secondBrain = {
    ...db.secondBrain,
    brandVault: {
      ...db.secondBrain.brandVault,
      brandSlogan: slogan || db.secondBrain.brandVault.brandSlogan,
      corePositioning: `AI-native growth infrastructure built for ${brandName}.`,
    },
    customerVault: { ...db.secondBrain.customerVault, idealCustomerProfile: audience || db.secondBrain.customerVault.idealCustomerProfile },
    websiteVault: { ...db.secondBrain.websiteVault, cmsType: cmsType || db.secondBrain.websiteVault.cmsType },
    marketingVault: { ...db.secondBrain.marketingVault, campaignHistory: channel ? `Marketing channel: ${channel}` : db.secondBrain.marketingVault.campaignHistory },
  };
  steps.push(`Second Brain updated: Brand, Customer, Website, Marketing vaults written for ${brandName}.`);

  const token = crypto.randomBytes(24).toString("hex");
  const { error: tokenErr } = await res.locals.sb.from("intake_tokens").insert({
    token,
    workspace_id: res.locals.wsId,
    client_email: clientEmail,
    requested_fields: REQUESTED_INTAKE_FIELDS,
  });
  if (tokenErr) {
    res.status(500).json({ error: "Failed to create intake token: " + tokenErr.message });
    return;
  }
  steps.push(`Intake token created (expires in 14 days).`);

  const appUrl = (process.env.APP_URL && !process.env.APP_URL.startsWith("MY_")) ? process.env.APP_URL : "http://localhost:3000";
  const completionUrl = `${appUrl.replace(/\/$/, "")}/intake/${token}`;
  const emailResult = await sendEmail({
    to: clientEmail,
    subject: `Complete your ${brandName} onboarding`,
    html: `
      <p>Hi,</p>
      <p>We're setting up your Growth OS workspace. To finish onboarding, please complete a few remaining items:</p>
      <ul>${REQUESTED_INTAKE_FIELDS.map(f => `<li>${f}</li>`).join("")}</ul>
      <p><a href="${completionUrl}">Complete onboarding →</a></p>
      <p>This link expires in 14 days.</p>
    `,
  });
  steps.push(emailResult.sent ? `Onboarding email sent to ${clientEmail} (via ${emailResult.provider}).` : `Email not sent live (${emailResult.provider === "mock" ? "RESEND_API_KEY not set — logged instead" : "send failed"}) — content logged server-side.`);

  await saveDB(res, db);

  const intakeTask = { id: "intake-" + Date.now(), clientEmail, brandName, token, status: "Email Sent" as const, createdAt: new Date().toISOString().split("T")[0] };
  (db as any).intakePipelineTasks = [intakeTask, ...((db as any).intakePipelineTasks || [])];
  await saveDB(res, db);

  res.json({ success: true, steps, secondBrain: db.secondBrain, intakeTask, emailSent: emailResult.sent });
});

// Intake questionnaire -> real (#dm-suite audit fix). The Intake Engine page
// used to "complete" after a client-side timer and claim vaults were updated
// that nothing ever wrote. This route persists the questionnaire into the
// Second Brain vaults (the same store the rest of the OS reads), honestly,
// field-by-field — only non-empty answers are written, and the response says
// exactly which fields landed where.
router.post('/intake/questionnaire', async (req: Request, res: Response) => {
  const body = req.body as Record<string, string> | undefined;
  const companyName = (body?.companyName || "").trim();
  const primaryICP = (body?.primaryICP || "").trim();
  const websiteUrl = (body?.websiteUrl || "").trim();
  const monthlyRevenue = (body?.monthlyRevenue || "").trim();
  const primaryChannel = (body?.primaryChannel || "").trim();
  const monthlyAdSpend = (body?.monthlyAdSpend || "").trim();
  const primaryBottleneck = (body?.primaryBottleneck || "").trim();
  const brandVoiceTone = (body?.brandVoiceTone || "").trim();
  const competitorDifferentiator = (body?.competitorDifferentiator || "").trim();

  if (!companyName || !primaryICP) {
    res.status(400).json({ error: "Company name and target ICP are required." });
    return;
  }
  if (websiteUrl) {
    try {
      const u = new URL(websiteUrl);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad protocol");
    } catch {
      res.status(400).json({ error: "Website URL must be a valid http(s) URL." });
      return;
    }
  }

  const db = await getDB(res);
  const written: Array<{ vault: string; field: string }> = [];

  if (websiteUrl) {
    db.secondBrain.websiteVault.siteUrl = websiteUrl;
    written.push({ vault: "Website Vault", field: "siteUrl" });
  }
  if (brandVoiceTone) {
    db.secondBrain.brandVault.voiceAndTone = brandVoiceTone;
    written.push({ vault: "Brand Vault", field: "voiceAndTone" });
  }
  if (competitorDifferentiator) {
    db.secondBrain.brandVault.corePositioning = competitorDifferentiator;
    written.push({ vault: "Brand Vault", field: "corePositioning" });
  }
  if (primaryICP) {
    db.secondBrain.customerVault.idealCustomerProfile = primaryICP;
    written.push({ vault: "Customer Vault", field: "idealCustomerProfile" });
  }
  if (primaryChannel) {
    db.secondBrain.marketingVault.currentChannels = [
      ...new Set([...(db.secondBrain.marketingVault.currentChannels || []), primaryChannel]),
    ];
    written.push({ vault: "Marketing Vault", field: "currentChannels" });
  }
  // Free-text context the vaults have no dedicated column for: recorded
  // verbatim in the vaults they concern. No metric is derived from them
  // here — a CAC baseline only exists once real spend+conversion data lands.
  if (monthlyRevenue || monthlyAdSpend) {
    db.secondBrain.executiveVault.financialsOverview =
      `${db.secondBrain.executiveVault.financialsOverview || ""} Intake (${new Date().toISOString().split("T")[0]}): revenue band ${monthlyRevenue || "unspecified"}; media spend ${monthlyAdSpend || "unspecified"}.`.trim();
    written.push({ vault: "Executive Vault", field: "financialsOverview" });
  }
  if (primaryBottleneck) {
    db.secondBrain.auditVault.findings.funnelQuality = primaryBottleneck;
    written.push({ vault: "Audit Vault", field: "funnelQuality (reported bottleneck)" });
  }

  await saveDB(res, db);

  res.json({
    success: true,
    written,
    unanswered: [
      ...(monthlyRevenue ? [] : ["monthlyRevenue"]),
      ...(monthlyAdSpend ? [] : ["monthlyAdSpend"]),
      ...(primaryBottleneck ? [] : ["primaryBottleneck"]),
    ],
    secondBrain: db.secondBrain,
  });
});

  return router;
}
