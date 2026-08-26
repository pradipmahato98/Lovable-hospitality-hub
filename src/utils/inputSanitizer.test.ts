import { describe, it, expect } from "vitest";
import { escapeForDisplay, sanitizeHTML, sanitizeURL } from "./inputSanitizer";

describe("escapeForDisplay", () => {
  it("escapes HTML special characters to prevent DOM XSS", () => {
    const input = '<script>alert("XSS")</script>';
    const escaped = escapeForDisplay(input);
    expect(escaped).toBe("&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;");
  });

  it("escapes ampersands and quotes correctly", () => {
    const input = "Tom & Jerry's `code` <foo>";
    const escaped = escapeForDisplay(input);
    expect(escaped).toBe("Tom &amp; Jerry&#x27;s &#96;code&#96; &lt;foo&gt;");
  });

  it("handles empty or non-string input safely", () => {
    expect(escapeForDisplay("")).toBe("");
    expect(escapeForDisplay(null as unknown as string)).toBe("");
  });
});

describe("sanitizeHTML", () => {
  it("removes HTML tags and inline event handlers", () => {
    const input = '<b onclick="alert(1)">Hello</b>';
    expect(sanitizeHTML(input)).toBe("Hello");
  });
});

describe("sanitizeURL", () => {
  it("blocks dangerous protocols", () => {
    expect(sanitizeURL("javascript:alert(1)")).toBe("");
    expect(sanitizeURL("https://example.com")).toBe("https://example.com");
  });
});
