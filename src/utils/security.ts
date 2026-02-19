/**
 * Security utilities for LuxeStay ERP
 */

/**
 * Generates a cryptographically secure random string of a given length.
 * Uses the Web Crypto API to ensure high entropy and incorporates rejection
 * sampling to avoid modulo bias.
 *
 * @param length The length of the string to generate
 * @returns A secure random string
 */
export const generateSecureRandomString = (length: number = 32): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charsetLength = charset.length;

  // Use a global-safe reference to crypto
  const cryptoObj = typeof window !== 'undefined' ? (window.crypto || (window as any).msCrypto) : null;

  if (!cryptoObj) {
    throw new Error("Cryptography API not available in this environment");
  }

  const maxUint32 = 4294967295;
  const limit = maxUint32 - (maxUint32 % charsetLength);

  let result = "";
  const tempValues = new Uint32Array(1);

  while (result.length < length) {
    cryptoObj.getRandomValues(tempValues);
    if (tempValues[0] < limit) {
      result += charset[tempValues[0] % charsetLength];
    }
  }

  return result;
};

/**
 * Generates a secure API key with a standard prefix.
 *
 * @param prefix The prefix for the API key (default: 'sk')
 * @returns A formatted secure API key
 */
export const generateSecureAPIKey = (prefix: string = "sk"): string => {
  return `${prefix}_${generateSecureRandomString(24)}`;
};
