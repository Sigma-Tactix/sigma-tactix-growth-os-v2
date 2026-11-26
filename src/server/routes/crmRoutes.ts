import { Router, type Request, type Response } from 'express';

// ---------------------------------------------------------------------------
// CRM — contacts + deals CRUD (Postgres via the JWT-forwarding client).
//
// Extracted from server.ts (P2 increment 5 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). Tables crm_contacts/crm_deals and their
// RLS shipped in migration 0003; every query is scoped to res.locals.wsId
// by RLS already — the router itself only needs the subscription-tier gate.
//
// requireModule (the fail-closed entitlement middleware) is INJECTED: it
// lives in server.ts because it is shared with many other route families.
// Mounted under /api/workspace/crm AFTER the global
// app.use("/api/workspace", requireAuth) in server.ts, so the auth and
// rate-limiter semantics are unchanged from the original inline handlers.
//
// import-hubspot (POST /contacts/import-hubspot) deliberately stays inline
// in server.ts for now: it needs the connector cluster's getStoredCredentials
// / getDB, which is shared by the connectors increment. Once that shared
// adapter module lands, import-hubspot moves here and re-exports from it.
// No routing ambiguity: this router has no POST /contacts/:anything sibling,
// so the still-inline import-hubspot POST resolves exactly as before.
// ---------------------------------------------------------------------------

export interface CrmRouterDeps {
  requireModule: (mod: string) => any;
}

const DEAL_STAGES = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

export function createCrmRouter(deps: CrmRouterDeps): Router {
  const router = Router();
  const { requireModule } = deps;

  router.get('/contacts', requireModule('crm'), async (req: Request, res: Response) => {
    const { data, error } = await res.locals.sb.from("crm_contacts").select("*").order("created_at", { ascending: false });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true, contacts: data });
  });

  router.post('/contacts', requireModule('crm'), async (req: Request, res: Response) => {
    const { name, email, company, phone, source, owner, notes } = req.body as Record<string, string | undefined>;
    if (!name || !name.trim()) { res.status(400).json({ error: "Contact name is required." }); return; }
    const { data, error } = await res.locals.sb
      .from("crm_contacts")
      .insert({ workspace_id: res.locals.wsId, name: name.trim(), email, company, phone, source, owner, notes })
      .select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true, contact: data });
  });

  router.patch('/contacts/:id', requireModule('crm'), async (req: Request, res: Response) => {
    const { name, email, company, phone, source, owner, notes } = req.body as Record<string, string | undefined>;
    const patch: Record<string, any> = {};
    if (name !== undefined) patch.name = name;
    if (email !== undefined) patch.email = email;
    if (company !== undefined) patch.company = company;
    if (phone !== undefined) patch.phone = phone;
    if (source !== undefined) patch.source = source;
    if (owner !== undefined) patch.owner = owner;
    if (notes !== undefined) patch.notes = notes;
    const { data, error } = await res.locals.sb.from("crm_contacts").update(patch).eq("id", req.params.id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true, contact: data });
  });

  router.delete('/contacts/:id', requireModule('crm'), async (req: Request, res: Response) => {
    const { error } = await res.locals.sb.from("crm_contacts").delete().eq("id", req.params.id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  });

  router.get('/deals', requireModule('crm'), async (req: Request, res: Response) => {
    const { data, error } = await res.locals.sb.from("crm_deals").select("*").order("created_at", { ascending: false });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true, deals: data });
  });

  router.post('/deals', requireModule('crm'), async (req: Request, res: Response) => {
    const { contactId, title, stage, value, closeDate, notes } = req.body as { contactId?: string; title?: string; stage?: string; value?: number; closeDate?: string; notes?: string };
    if (!title || !title.trim()) { res.status(400).json({ error: "Deal title is required." }); return; }
    if (stage && !DEAL_STAGES.includes(stage)) { res.status(400).json({ error: `Stage must be one of: ${DEAL_STAGES.join(", ")}` }); return; }
    const { data, error } = await res.locals.sb
      .from("crm_deals")
      .insert({ workspace_id: res.locals.wsId, contact_id: contactId || null, title: title.trim(), stage: stage || 'New', value: value ?? null, close_date: closeDate || null, notes })
      .select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true, deal: data });
  });

  router.patch('/deals/:id', requireModule('crm'), async (req: Request, res: Response) => {
    const { title, stage, value, closeDate, notes, contactId } = req.body as { title?: string; stage?: string; value?: number; closeDate?: string; notes?: string; contactId?: string };
    if (stage && !DEAL_STAGES.includes(stage)) { res.status(400).json({ error: `Stage must be one of: ${DEAL_STAGES.join(", ")}` }); return; }
    const patch: Record<string, any> = {};
    if (title !== undefined) patch.title = title;
    if (stage !== undefined) patch.stage = stage;
    if (value !== undefined) patch.value = value;
    if (closeDate !== undefined) patch.close_date = closeDate;
    if (notes !== undefined) patch.notes = notes;
    if (contactId !== undefined) patch.contact_id = contactId || null;
    const { data, error } = await res.locals.sb.from("crm_deals").update(patch).eq("id", req.params.id).select().single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true, deal: data });
  });

  router.delete('/deals/:id', requireModule('crm'), async (req: Request, res: Response) => {
    const { error } = await res.locals.sb.from("crm_deals").delete().eq("id", req.params.id);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  });

  return router;
}
