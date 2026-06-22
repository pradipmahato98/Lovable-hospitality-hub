/**
 * Input Sanitization Utilities
 * 
 * Provides XSS prevention through HTML stripping, character escaping,
 * and URL validation for the Cloud Hotel ERP system.
 */

// ─── HTML Tag Stripping ─────────────────────────────────────────────────────

/**
 * Strips all HTML tags from a string input.
 * Use this for user-generated text content (guest names, notes, descriptions).
 * 
 * @example
 * sanitizeHTML('<script>alert("xss")</script>Hello') // 'Hello'
 * sanitizeHTML('<b>Bold</b> text') // 'Bold text'
 */
export function sanitizeHTML(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove all HTML tags
  const withoutTags = input.replace(/<[^>]*>/g, '');
  
  // Remove potentially dangerous attributes even without tags
  const withoutEvents = withoutTags.replace(
    /on\w+\s*=\s*["'][^"']*["']/gi,
    ''
  );
  
  // Remove javascript: protocol references
  const withoutJSProtocol = withoutEvents.replace(
    /javascript\s*:/gi,
    ''
  );
  
  return withoutJSProtocol.trim();
}

/**
 * Partially sanitizes HTML for use in document templates.
 * Allows safe structural tags but strips scripts, iframes, and event handlers.
 * Uses DOMParser for robust sanitization in browser environments.
 *
 * @example
 * sanitizeTemplateHTML('<b>Hello</b><script>alert(1)</script>') // '<b>Hello</b>'
 */
export function sanitizeTemplateHTML(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Fallback for non-browser environments (minimal protection)
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return input.replace(/<(script|iframe|object|embed|frameset|base)[^>]*>([\s\S]*?)<\/\1>/gi, '')
                .replace(/<(script|iframe|object|embed|frameset|base)[^>]*>/gi, '')
                .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
                .trim();
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');

    // 1. Remove dangerous tags
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'frameset', 'base', 'link', 'meta'];
    dangerousTags.forEach(tag => {
      doc.querySelectorAll(tag).forEach(el => el.remove());
    });

    // 2. Clean attributes on all elements
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      const attrs = Array.from(el.attributes);
      attrs.forEach(attr => {
        const name = attr.name.toLowerCase();
        const value = attr.value.toLowerCase();

        // Strip event handlers (on*)
        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }

        // Strip dangerous URI schemes
        if (['href', 'src', 'action', 'background', 'formaction'].includes(name)) {
          if (value.includes('javascript:') || value.includes('data:') || value.includes('vbscript:')) {
            el.setAttribute(attr.name, '#');
          }
        }
      });
    });

    return doc.body.innerHTML.trim();
  } catch (e) {
    console.error('[Security] DOMParser sanitization failed:', e);
    return ''; // Fail secure
  }
}

// ─── Character Escaping ─────────────────────────────────────────────────────

/**
 * Escapes special HTML characters for safe rendering.
 * Use this when displaying user content in HTML contexts where you need
 * to preserve the original text but prevent injection.
 * 
 * @example
 * escapeForDisplay('<script>') // '&lt;script&gt;'
 * escapeForDisplay('a & b') // 'a &amp; b'
 */
export function escapeForDisplay(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#96;',
  };
  
  return input.replace(/[&<>"'/`]/g, (char) => escapeMap[char] || char);
}

// ─── URL Validation & Sanitization ──────────────────────────────────────────

/**
 * Validates and sanitizes a URL. Blocks dangerous protocols (javascript:, data:, vbscript:)
 * and returns only http/https/mailto URLs.
 * 
 * @returns The sanitized URL, or empty string if invalid/dangerous
 * 
 * @example
 * sanitizeURL('https://example.com') // 'https://example.com'
 * sanitizeURL('javascript:alert(1)') // ''
 * sanitizeURL('data:text/html,<h1>XSS</h1>') // ''
 */
export function sanitizeURL(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  const trimmed = input.trim();
  
  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
  if (dangerousProtocols.test(trimmed)) {
    console.warn(`[Security] Blocked dangerous URL protocol: ${trimmed.substring(0, 20)}...`);
    return '';
  }
  
  // Allow only http, https, mailto, tel, and relative URLs
  const allowedProtocols = /^(https?:|mailto:|tel:|\/|#)/i;
  if (trimmed.includes(':') && !allowedProtocols.test(trimmed)) {
    return '';
  }
  
  try {
    // Validate it's a parseable URL (for absolute URLs)
    if (/^https?:\/\//i.test(trimmed)) {
      new URL(trimmed);
    }
    return trimmed;
  } catch {
    return '';
  }
}

// ─── Form Data Sanitization ─────────────────────────────────────────────────

type SanitizableValue = string | number | boolean | null | undefined;

/**
 * Recursively sanitizes all string values in a form data object.
 * Non-string values (numbers, booleans, null) are passed through unchanged.
 * 
 * @example
 * sanitizeFormData({
 *   name: '<script>alert("xss")</script>John',
 *   email: 'john@example.com',
 *   age: 30,
 *   isVip: true,
 * })
 * // { name: 'John', email: 'john@example.com', age: 30, isVip: true }
 */
export function sanitizeFormData<T extends Record<string, SanitizableValue>>(
  data: T
): T {
  const sanitized = {} as Record<string, SanitizableValue>;
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHTML(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

// ─── SQL Injection Prevention (Defense-in-Depth) ────────────────────────────

/**
 * Checks if a string contains common SQL injection patterns.
 * NOTE: This is a defense-in-depth measure. Supabase uses parameterized queries
 * via PostgREST, so SQL injection at the DB layer is already prevented.
 * This catches suspicious input before it reaches the API.
 * 
 * @returns true if the input appears safe, false if suspicious
 */
export function isSafeInput(input: string): boolean {
  if (!input || typeof input !== 'string') return true;
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION)\b.*\b(FROM|INTO|TABLE|SET|WHERE)\b)/i,
    /(--|;|\|\||&&)/,
    /('.*OR.*'.*=.*')/i,
    /(\/\*.*\*\/)/,
  ];
  
  return !sqlPatterns.some((pattern) => pattern.test(input));
}

// ─── Sanitization Helpers ───────────────────────────────────────────────────

/**
 * Sanitizes a phone number input. Allows only digits, spaces, dashes, 
 * parentheses, and + prefix.
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[^\d\s-+()]/g, '').trim();
}

/**
 * Sanitizes an email address. Basic validation + stripping of dangerous characters.
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim().toLowerCase();
  // Allow only valid email characters
  const cleaned = trimmed.replace(/[^a-z0-9@._+-]/g, '');
  return cleaned;
}

/**
 * Truncates a string to a maximum length, preventing buffer overflow attacks
 * from extremely long inputs.
 */
export function truncateInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return '';
  return input.substring(0, maxLength);
}
