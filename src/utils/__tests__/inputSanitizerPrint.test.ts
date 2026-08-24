import { describe, it, expect } from "vitest";
import { escapeForDisplay } from "../inputSanitizer";

describe("escapeForDisplay in print contexts", () => {
  it("escapes script tags to prevent XSS in printable HTML documents", () => {
    const maliciousInput = "<script>alert('xss')</script>";
    const sanitized = escapeForDisplay(maliciousInput);
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).toBe("&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;");
  });

  it("escapes double quotes and event handlers", () => {
    const maliciousInput = 'Voucher "onload="alert(1)';
    const sanitized = escapeForDisplay(maliciousInput);
    expect(sanitized).toContain("&quot;");
  });
});
