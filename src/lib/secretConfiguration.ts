/** Recognize documented examples; presence alone is not provider verification. */
export function isPlaceholderSecret(value: string | undefined): boolean {
  return !value?.trim() || /^(?:MY_|YOUR_|your[-_]|sk_(?:test|live)_your_|pk_(?:test|live)_your_|whsec_your_|placeholder|changeme)/i.test(value.trim());
}
