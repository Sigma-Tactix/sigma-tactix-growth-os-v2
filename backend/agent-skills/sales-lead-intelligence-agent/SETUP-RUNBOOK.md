# AI Lead Intelligence Agent — Setup Runbook (60–90 Min)

Wiring guide for Sigma Tactix internal deployment and client demo skins.

---

## Prerequisites & Credentials Required

1. **Supabase Database**
   - Execute `supabase/schema.sql` in the Supabase SQL editor.
   - Note `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

2. **Twilio Account**
   - WhatsApp-enabled sender (or Twilio WhatsApp Sandbox for testing).
   - `ACCOUNT_SID` and `AUTH_TOKEN`.
   - Submit 3 templates in Twilio Content Template Builder:
     - `followup_1`: `Hi {{1}}, following up on your enquiry with {{2}}. Happy to answer any questions, or you can grab a call slot here: {{3}}`
     - `followup_2`: `Hi {{1}}, still interested in {{2}}? If timing is off, tell me when to check back and I'll leave you alone until then.`
     - `followup_3`: `Hi {{1}}, closing your enquiry with {{2}} for now. If things change, this link always works: {{3}}`
   - Note the resulting `ContentSid` for each template (`HX...`).

3. **Anthropic Claude API Key**
   - Key with access to `claude-haiku-4-5-20251001` or `claude-3-5-sonnet`.

4. **n8n Instance (Self-hosted or Cloud)**
   - Import the 3 workflow JSON files located in `n8n/`.

---

## Step 1: Database Migration (10 mins)

1. Open Supabase Dashboard → SQL Editor.
2. Paste the contents of `supabase/schema.sql` and run.
3. Confirm tables `leads`, `lead_messages`, `appointments`, and view `v_lead_pipeline` are created.

---

## Step 2: Import & Configure n8n Workflows (30 mins)

### Workflow 01: Lead Intake & Qualify (`01-lead-intake-qualify.json`)

1. Import into n8n.
2. Configure Credentials:
   - `Supabase (service role)`: Set URL and Service Role Key.
   - `Anthropic API Key`: Add header `x-api-key`.
   - `Twilio Basic Auth`: Set SID as Username, Auth Token as Password.
3. Replace placeholders:
   - `+REPLACE_FOUNDER_PHONE`: Founder WhatsApp number (e.g. `+971501234567`).
   - `+REPLACE_TWILIO_WHATSAPP_NUMBER`: Twilio WhatsApp number.
4. Activate workflow and copy the Webhook URL.
5. In your website form (Contact Form 7 / Webhook / Zapier), POST submissions to this Webhook URL.

### Workflow 02: WhatsApp Conversation (`02-whatsapp-conversation.json`)

1. Import into n8n.
2. In Twilio Console → Messaging → Senders → WhatsApp:
   - Configure "When a message comes in" webhook: Point to the n8n webhook URL `.../webhook/whatsapp-inbound`.
3. Fill credentials (Anthropic, Twilio, Supabase).
4. Verify facts block and booking link `https://cal.com/sigmatactix/discovery`.
5. Activate workflow.

### Workflow 03: Follow-up Scheduler (`03-followup-scheduler.json`)

1. Import into n8n.
2. In the "Prepare Follow-ups" node, replace:
   - `REPLACE_BOOKING_LINK` → Your Cal.com or Calendly URL.
   - `REPLACE_CONTENT_SID_FOLLOWUP_1` → Twilio Content SID for template 1.
   - `REPLACE_CONTENT_SID_FOLLOWUP_2` → Twilio Content SID for template 2.
   - `REPLACE_CONTENT_SID_FOLLOWUP_3` → Twilio Content SID for template 3.
3. Set cron frequency: defaults to every 30 minutes (`*/30 * * * *`).
4. Activate workflow.

---

## Step 3: End-to-End Verification (15 mins)

1. Submit a test lead through the intake webhook with high budget and immediate timeline.
2. Confirm:
   - Lead appears in Supabase `leads` table with score >= 70 (`hot`).
   - WhatsApp alert arrives on founder's mobile phone within 15 seconds.
3. Send an inbound WhatsApp message from a test phone.
4. Confirm:
   - Two-way conversation responds within 3 sentences without hallucinations.
   - Test "Can you send a custom legal NDA?" triggers human handoff alert.
5. Run the Follow-up Scheduler manually:
   - Verify due leads receive Step 1 template and advance to Step 2.
