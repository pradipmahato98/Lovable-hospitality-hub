/**
 * Generates a cryptographically secure random string for API keys.
 * Uses window.crypto.getRandomValues() and rejection sampling to avoid modulo bias.
 */
export const generateSecureAPIKey = (length: number = 24): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const array = new Uint8Array(length);
  let result = "";

  while (result.length < length) {
    window.crypto.getRandomValues(array);
    for (let i = 0; i < array.length && result.length < length; i++) {
      // 256 - (256 % 62) = 248. This ensures each character has an equal probability.
      if (array[i] < 248) {
        result += charset[array[i] % charset.length];
      }
    }
  }

  return `sk_${result}`;
};
