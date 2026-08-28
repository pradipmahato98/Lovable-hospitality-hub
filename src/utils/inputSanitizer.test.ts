import { describe, it, expect } from 'vitest';
import { escapeForDisplay, sanitizeHTML, sanitizeURL } from './inputSanitizer';

describe('escapeForDisplay', () => {
  it('escapes HTML special characters to prevent XSS injection', () => {
    const maliciousInput = '<script>alert("XSS")</script> & \' `/';
    const escaped = escapeForDisplay(maliciousInput);
    expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt; &amp; &#x27; &#96;&#x2F;');
  });

  it('handles empty or non-string input safely', () => {
    expect(escapeForDisplay('')).toBe('');
    // @ts-expect-error testing invalid input types
    expect(escapeForDisplay(null)).toBe('');
  });
});

describe('sanitizeHTML', () => {
  it('removes HTML tags and inline scripts', () => {
    const dirty = '<img src=x onerror=alert(1)>Hello World';
    expect(sanitizeHTML(dirty)).toBe('Hello World');
  });
});

describe('sanitizeURL', () => {
  it('blocks dangerous protocol URLs', () => {
    expect(sanitizeURL('javascript:alert(1)')).toBe('');
    expect(sanitizeURL('https://example.com')).toBe('https://example.com');
  });
});
