import { describe, it, expect } from "vitest";
import { escapeForDisplay, sanitizeHTML, sanitizeURL } from "./inputSanitizer";

describe("inputSanitizer", () => {
  describe("escapeForDisplay", () => {
    it("escapes special HTML characters", () => {
      const input = `<script>alert('xss "test" & ` + '`' + `')</script>/`;
      const escaped = escapeForDisplay(input);
      expect(escaped).not.toContain("<");
      expect(escaped).not.toContain(">");
      expect(escaped).not.toContain('"');
      expect(escaped).not.toContain("'");
      expect(escaped).toContain("&lt;script&gt;");
      expect(escaped).toContain("&quot;test&quot;");
      expect(escaped).toContain("&#x27;");
      expect(escaped).toContain("&#x2F;");
      expect(escaped).toContain("&#96;");
    });

    it("returns empty string for empty input", () => {
      expect(escapeForDisplay("")).toBe("");
      expect(escapeForDisplay(String(null))).toBe("null");
      expect(escapeForDisplay(String(undefined))).toBe("undefined");
    });
  });

  describe("sanitizeHTML", () => {
    it("strips HTML tags and event handlers", () => {
      expect(sanitizeHTML('<b onclick="alert(1)">Hello</b>')).toBe("Hello");
    });
  });

  describe("sanitizeURL", () => {
    it("blocks javascript: protocol", () => {
      expect(sanitizeURL("javascript:alert(1)")).toBe("");
    });

    it("allows standard http/https URLs", () => {
      expect(sanitizeURL("https://example.com")).toBe("https://example.com");
    });
  });
});
