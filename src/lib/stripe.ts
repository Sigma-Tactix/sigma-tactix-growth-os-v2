import Stripe from "stripe";
import { isPlaceholderSecret } from './secretConfiguration.js';

// Same "real call if key present, log/mock otherwise" pattern used for Gemini
// and Resend throughout this codebase — Billing (#17) has no fake fallback
// path (there's nothing honest to fake for money), so isStripeConfigured()
// is the one thing every billing route checks first: unconfigured means
// "Billing not configured" in the UI, never invented numbers.
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return !isPlaceholderSecret(key);
}

let stripeClient: Stripe | null = null;
export function getStripeClient(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  }
  return stripeClient;
}

export function isStripeWebhookConfigured(): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  return !isPlaceholderSecret(secret);
}
