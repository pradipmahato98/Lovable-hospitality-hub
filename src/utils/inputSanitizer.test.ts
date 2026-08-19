import { describe, it, expect } from 'vitest';
import { sanitizeURL } from './inputSanitizer';

describe('sanitizeURL', () => {
  it('allows safe http/https/mailto/tel and relative URLs', () => {
    expect(sanitizeURL('https://example.com')).toBe('https://example.com');
    expect(sanitizeURL('http://example.com/path?q=1')).toBe('http://example.com/path?q=1');
    expect(sanitizeURL('mailto:user@example.com')).toBe('mailto:user@example.com');
    expect(sanitizeURL('tel:+1234567890')).toBe('tel:+1234567890');
    expect(sanitizeURL('/dashboard')).toBe('/dashboard');
    expect(sanitizeURL('#section')).toBe('#section');
  });

  it('blocks dangerous protocols', () => {
    expect(sanitizeURL('javascript:alert(1)')).toBe('');
    expect(sanitizeURL('data:text/html,<h1>XSS</h1>')).toBe('');
    expect(sanitizeURL('vbscript:msgbox(1)')).toBe('');
    expect(sanitizeURL('file:///etc/passwd')).toBe('');
  });

  it('strips control characters to prevent protocol bypasses', () => {
    expect(sanitizeURL('java\x00script:alert(1)')).toBe('');
    expect(sanitizeURL('java\x08script:alert(1)')).toBe('');
    expect(sanitizeURL('https://example.com/\x00test')).toBe('https://example.com/test');
  });

  it('handles invalid input gracefully', () => {
    expect(sanitizeURL('')).toBe('');
    expect(sanitizeURL(null as unknown as string)).toBe('');
    expect(sanitizeURL(undefined as unknown as string)).toBe('');
  });
});
