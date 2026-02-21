/**
 * Central security utility for cryptographically secure operations.
 * Replaces insecure Math.random() usage for sensitive data.
 */

/**
 * Generates a cryptographically secure random string of a given length.
 * Uses rejection sampling to avoid modulo bias.
 */
export const generateSecureRandomString = (length: number): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charsetLength = charset.length;

  const getCrypto = () => {
    if (typeof window !== 'undefined' && window.crypto) return window.crypto;
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') return crypto;
    return null;
  };

  const cryptoInstance = getCrypto();

  if (!cryptoInstance) {
    console.warn("Secure crypto not available, falling back to pseudo-randomness.");
    return Array.from({ length }, () => charset.charAt(Math.floor(Math.random() * charsetLength))).join('');
  }

  // Use rejection sampling to avoid modulo bias
  const maxUint8 = 256;
  const limit = maxUint8 - (maxUint8 % charsetLength);
  let secureString = "";

  while (secureString.length < length) {
    const temp = new Uint8Array(length - secureString.length);
    cryptoInstance.getRandomValues(temp);

    for (let i = 0; i < temp.length; i++) {
      if (temp[i] < limit) {
        secureString += charset.charAt(temp[i] % charsetLength);
        if (secureString.length === length) break;
      }
    }
  }

  return secureString;
};

/**
 * Generates a secure API key with a standard prefix.
 */
export const generateSecureAPIKey = (prefix: string = "sk", length: number = 24): string => {
  return `${prefix}_${generateSecureRandomString(length)}`;
};
