import { describe, it, expect } from 'vitest';
import { sanitizeURL, sanitizeEmail } from './inputSanitizer';

describe('inputSanitizer', () => {
  describe('sanitizeURL', () => {
    it('allows valid http and https URLs', () => {
      expect(sanitizeURL('https://example.com')).toBe('https://example.com');
      expect(sanitizeURL('http://example.com/path?query=1')).toBe('http://example.com/path?query=1');
    });

    it('blocks dangerous javascript: protocol URLs', () => {
      expect(sanitizeURL('javascript:alert(1)')).toBe('');
      expect(sanitizeURL('java\x00script:alert(1)')).toBe('');
      expect(sanitizeURL('javascript\x1F:alert(1)')).toBe('');
    });

    it('blocks data: and vbscript: URLs', () => {
      expect(sanitizeURL('data:text/html,<h1>XSS</h1>')).toBe('');
      expect(sanitizeURL('vbscript:msgbox(1)')).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('cleans email inputs properly without regex escape warnings', () => {
      expect(sanitizeEmail(' USER@Example.com ')).toBe('user@example.com');
      expect(sanitizeEmail('test+alias@domain.org')).toBe('test+alias@domain.org');
    });
  });
});
