import { describe, it, expect } from 'vitest';
import { generateKey, encryptData, decryptData, exportKey, importKey, deriveKey } from './encryption';

describe('Encryption Utilities', () => {
  it('should encrypt and decrypt data correctly', async () => {
    const key = await generateKey();
    const originalText = "Sensitive Information";

    const { encrypted, iv } = await encryptData(originalText, key);
    expect(encrypted).not.toBe(originalText);

    const decryptedText = await decryptData(encrypted, iv, key);
    expect(decryptedText).toBe(originalText);
  });

  it('should export and import keys correctly', async () => {
    const key = await generateKey();
    const exportedKey = await exportKey(key);
    expect(typeof exportedKey).toBe('string');

    const importedKey = await importKey(exportedKey);
    const originalText = "Test Data";
    const { encrypted, iv } = await encryptData(originalText, key);
    const decryptedText = await decryptData(encrypted, iv, importedKey);

    expect(decryptedText).toBe(originalText);
  });

  it('should derive the same key from the same password and salt', async () => {
    const password = "master-password";
    const salt = "unique-salt";

    const key1 = await deriveKey(password, salt);
    const key2 = await deriveKey(password, salt);

    const exported1 = await exportKey(key1);
    const exported2 = await exportKey(key2);

    expect(exported1).toBe(exported2);
  });
});
