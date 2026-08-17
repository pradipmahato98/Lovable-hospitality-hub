import { describe, it, expect } from 'vitest';
import {
  sanitizeHTML,
  escapeForDisplay,
  sanitizeURL,
  sanitizeFormData,
  isSafeInput,
  sanitizePhone,
  sanitizeEmail,
  truncateInput,
} from './inputSanitizer';

describe('inputSanitizer', () => {
  describe('sanitizeURL', () => {
    it('allows valid HTTP and HTTPS URLs', () => {
      expect(sanitizeURL('https://example.com')).toBe('https://example.com');
      expect(sanitizeURL('http://sub.domain.org/path?query=1')).toBe('http://sub.domain.org/path?query=1');
    });

    it('allows relative URLs and mailto/tel links', () => {
      expect(sanitizeURL('/dashboard/settings')).toBe('/dashboard/settings');
      expect(sanitizeURL('#section')).toBe('#section');
      expect(sanitizeURL('mailto:test@example.com')).toBe('mailto:test@example.com');
      expect(sanitizeURL('tel:+1234567890')).toBe('tel:+1234567890');
    });

    it('blocks dangerous protocols like javascript:, data:, vbscript:', () => {
      expect(sanitizeURL('javascript:alert(1)')).toBe('');
      expect(sanitizeURL('JAVASCRIPT:alert("xss")')).toBe('');
      expect(sanitizeURL('data:text/html,<h1>XSS</h1>')).toBe('');
      expect(sanitizeURL('vbscript:msgbox("hello")')).toBe('');
      expect(sanitizeURL('file:///etc/passwd')).toBe('');
    });

    it('blocks obfuscated javascript: URLs containing control characters or null bytes', () => {
      expect(sanitizeURL('java\x00script:alert(1)')).toBe('');
      expect(sanitizeURL('java\x01script:alert(1)')).toBe('');
      expect(sanitizeURL('javascript\x09:alert(1)')).toBe('');
    });

    it('handles empty or non-string inputs', () => {
      expect(sanitizeURL('')).toBe('');
      expect(sanitizeURL(null as unknown as string)).toBe('');
      expect(sanitizeURL(undefined as unknown as string)).toBe('');
    });
  });

  describe('sanitizeHTML', () => {
    it('removes HTML tags and inline event attributes', () => {
      expect(sanitizeHTML('<script>alert("xss")</script>Hello')).toBe('alert("xss")Hello');
      expect(sanitizeHTML('<b>Bold</b> text')).toBe('Bold text');
      expect(sanitizeHTML('<img src="x" onerror="alert(1)">')).toBe('');
    });
  });

  describe('escapeForDisplay', () => {
    it('escapes special HTML characters', () => {
      expect(escapeForDisplay('<script>')).toBe('&lt;script&gt;');
      expect(escapeForDisplay('a & b')).toBe('a &amp; b');
      expect(escapeForDisplay('"hello" & \'world\'')).toBe('&quot;hello&quot; &amp; &#x27;world&#x27;');
    });
  });

  describe('sanitizeFormData', () => {
    it('sanitizes strings in objects while preserving other types', () => {
      const input = {
        name: '<b>John</b>',
        age: 30,
        isVip: true,
        notes: null,
      };
      expect(sanitizeFormData(input)).toEqual({
        name: 'John',
        age: 30,
        isVip: true,
        notes: null,
      });
    });
  });

  describe('isSafeInput', () => {
    it('detects common SQL injection patterns', () => {
      expect(isSafeInput('SELECT * FROM users')).toBe(false);
      expect(isSafeInput("admin' OR '1'='1")).toBe(false);
      expect(isSafeInput('Normal text input')).toBe(true);
    });
  });

  describe('sanitizePhone & sanitizeEmail & truncateInput', () => {
    it('sanitizes phone numbers', () => {
      expect(sanitizePhone('+1 (555) 019-2834 <script>')).toBe('+1 (555) 019-2834');
    });

    it('sanitizes email addresses', () => {
      expect(sanitizeEmail(' USER@EXAMPLE.COM ')).toBe('user@example.com');
      expect(sanitizeEmail('test<script>@example.com')).toBe('testscript@example.com');
    });

    it('truncates overly long inputs', () => {
      expect(truncateInput('1234567890', 5)).toBe('12345');
    });
  });
});
