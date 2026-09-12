import { describe, it, expect } from "vitest";
import { encryptCredentials, decryptCredentials } from "./credentialCrypto.js";

describe("credential crypto (AES-256-GCM)", () => {
  it("round-trips an object through encrypt → decrypt", () => {
    const creds = { apiKey: "sk-live-abc123", refresh: "r-987", scopes: ["read", "write"] };
    const blob = encryptCredentials(creds);
    expect(decryptCredentials(blob)).toEqual(creds);
  });

  it("never stores the plaintext in the ciphertext blob", () => {
    const blob = encryptCredentials({ apiKey: "TOP-SECRET-TOKEN" });
    expect(blob).not.toContain("TOP-SECRET-TOKEN");
  });

  it("produces a different blob each call (random IV)", () => {
    const a = encryptCredentials({ apiKey: "same" });
    const b = encryptCredentials({ apiKey: "same" });
    expect(a).not.toEqual(b);
  });

  it("rejects a tampered ciphertext (GCM auth tag)", () => {
    const blob = encryptCredentials({ apiKey: "abc" });
    const raw = Buffer.from(blob, "base64");
    raw[raw.length - 1] ^= 0xff; // flip a byte in the ciphertext
    const tampered = raw.toString("base64");
    expect(() => decryptCredentials(tampered)).toThrow();
  });
});
