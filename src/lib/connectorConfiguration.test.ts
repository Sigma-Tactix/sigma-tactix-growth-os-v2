import { afterEach, describe, expect, it, vi } from 'vitest';
import { encryptCredentials } from './credentialCrypto.js';
import { isStripeConfigured, isStripeWebhookConfigured } from './stripe.js';

afterEach(() => vi.unstubAllEnvs());
describe('connector configuration', () => {
  it('rejects example Stripe credentials instead of advertising configured billing', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_your_stripe_secret_key');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_your_stripe_webhook_secret');
    expect(isStripeConfigured()).toBe(false);
    expect(isStripeWebhookConfigured()).toBe(false);
  });
  it('allows real-format test configuration for sandbox billing', () => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_1234567890abcdef');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_1234567890abcdef');
    expect(isStripeConfigured()).toBe(true);
    expect(isStripeWebhookConfigured()).toBe(true);
  });
  it('rejects the example encryption key before storing connector credentials', () => {
    vi.stubEnv('CONNECTOR_CREDENTIALS_KEY', 'your-32-byte-hex-encryption-key-here');
    expect(() => encryptCredentials({ token: 'test' })).toThrow(/CONNECTOR_CREDENTIALS_KEY/);
  });
  it('never uses the development encryption fallback in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CONNECTOR_CREDENTIALS_KEY', '');
    expect(() => encryptCredentials({ token: 'test' })).toThrow(/CONNECTOR_CREDENTIALS_KEY/);
  });
});
