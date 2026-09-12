// Thin Resend wrapper — same "real call if key present, log + return a mock
// result otherwise" pattern used for every Gemini call in server.ts, so
// intake/invite flows work end-to-end in dev without a provider key and
// activate for real the moment RESEND_API_KEY is set.

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  sent: boolean;
  provider: "resend" | "mock";
  id?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Growth OS <onboarding@sigmatactix.com>";

  if (!apiKey) {
    console.warn(`[email:mock] RESEND_API_KEY not set — logging instead of sending to ${input.to}`);
    console.log(`[email:mock] Subject: ${input.subject}\n${input.html}`);
    return { sent: false, provider: "mock" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Resend send failed (${res.status}): ${body}`);
      return { sent: false, provider: "resend" };
    }
    const data = (await res.json()) as { id?: string };
    return { sent: true, provider: "resend", id: data.id };
  } catch (err) {
    console.error("Resend send threw:", err);
    return { sent: false, provider: "resend" };
  }
}
