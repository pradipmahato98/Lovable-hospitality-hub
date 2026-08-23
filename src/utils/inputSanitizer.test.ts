import { describe, it, expect } from 'vitest';
import {
  escapeForDisplay,
  sanitizeHTML,
  sanitizeURL,
  sanitizeFormData,
} from './inputSanitizer';

describe('escapeForDisplay', () => {
  it('escapes special HTML characters to prevent XSS injection', () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    const escaped = escapeForDisplay(maliciousInput);
    expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  it('escapes quotes and dangerous characters in attribute/content strings', () => {
    const input = `Voucher "REF-123" & 'test' <tag>`;
    const escaped = escapeForDisplay(input);
    expect(escaped).toBe('Voucher &quot;REF-123&quot; &amp; &#x27;test&#x27; &lt;tag&gt;');
  });

  it('handles empty or non-string inputs gracefully', () => {
    expect(escapeForDisplay('')).toBe('');
    expect(escapeForDisplay(null as unknown as string)).toBe('');
    expect(escapeForDisplay(undefined as unknown as string)).toBe('');
  });
});

describe('sanitizeHTML', () => {
  it('removes HTML tags and inline event handlers', () => {
    const input = '<b onclick="alert(1)">Bold</b> <script>alert(2)</script>';
    expect(sanitizeHTML(input)).toBe('Bold alert(2)');
  });
});

describe('sanitizeURL', () => {
  it('blocks dangerous protocol URLs', () => {
    expect(sanitizeURL('javascript:alert(1)')).toBe('');
    expect(sanitizeURL('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('allows safe http and https URLs', () => {
    expect(sanitizeURL('https://example.com/test')).toBe('https://example.com/test');
  });
});

describe('sanitizeFormData', () => {
  it('sanitizes string fields in form objects', () => {
    const data = {
      name: '<script>alert(1)</script>John',
      amount: 100,
      active: true,
    };
    const sanitized = sanitizeFormData(data);
    expect(sanitized).toEqual({
      name: 'alert(1)John',
      amount: 100,
      active: true,
    });
  });
});
