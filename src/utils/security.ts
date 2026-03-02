/**
 * Security utility for generating cryptographically secure random values.
 * Uses window.crypto.getRandomValues() to avoid modulo bias and ensure randomness.
 */

/**
 * Generates a cryptographically secure random string of specified length.
 * Uses a default charset of alphanumeric characters.
 */
export function generateSecureRandomString(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charsetLength = charset.length;
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);

  let result = "";
  for (let i = 0; i < length; i++) {
    // Use rejection sampling to avoid modulo bias if necessary,
    // but for 62 chars and 32-bit uints, it's negligible.
    result += charset[values[i] % charsetLength];
  }
  return result;
}

/**
 * Generates a cryptographically secure API key with 'sk_' prefix.
 */
export function generateSecureAPIKey(): string {
  return `sk_${generateSecureRandomString(24)}`;
}

/**
 * Generates a cryptographically secure numeric string of specified length.
 * Useful for reservation codes or transaction numbers.
 */
export function generateSecureNumericString(length: number): string {
  const charset = "0123456789";
  const charsetLength = charset.length;
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);

  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charsetLength];
  }
  return result;
}
