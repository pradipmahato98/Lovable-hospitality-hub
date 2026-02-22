/**
 * Generates a cryptographically secure random string of specified length.
 * Uses window.crypto.getRandomValues() and rejection sampling to avoid modulo bias.
 */
export const generateSecureRandomString = (length: number, charset: string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"): string => {
  const array = new Uint8Array(length);
  let result = "";

  while (result.length < length) {
    window.crypto.getRandomValues(array);
    for (let i = 0; i < array.length && result.length < length; i++) {
      // Rejection sampling to avoid bias
      // 256 - (256 % charset.length)
      const limit = 256 - (256 % charset.length);
      if (array[i] < limit) {
        result += charset[array[i] % charset.length];
      }
    }
  }

  return result;
};

/**
 * Generates a cryptographically secure random API key with sk_ prefix.
 */
export const generateSecureAPIKey = (length: number = 24): string => {
  return `sk_${generateSecureRandomString(length)}`;
};

/**
 * Generates a cryptographically secure random numeric string of specified length.
 */
export const generateSecureNumericString = (length: number): string => {
  return generateSecureRandomString(length, "0123456789");
};
