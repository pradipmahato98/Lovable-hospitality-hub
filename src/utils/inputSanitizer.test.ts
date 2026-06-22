import { describe, it, expect } from "vitest";
import { sanitizeTemplateHTML } from "./inputSanitizer";

describe("sanitizeTemplateHTML", () => {
  it("should allow safe HTML tags", () => {
    const input = "<div><h1>Title</h1><p>Paragraph with <b>bold</b> and <i>italics</i>.</p></div>";
    const result = sanitizeTemplateHTML(input);
    expect(result).toBe(input);
  });

  it("should strip <script> tags and their content", () => {
    const input = "<div>Safe</div><script>alert('xss')</script>";
    const result = sanitizeTemplateHTML(input);
    expect(result).toBe("<div>Safe</div>");
  });

  it("should strip <iframe> tags", () => {
    const input = "<div>Safe</div><iframe src='https://malicious.com'></iframe>";
    const result = sanitizeTemplateHTML(input);
    expect(result).toBe("<div>Safe</div>");
  });

  it("should strip event handler attributes", () => {
    const input = "<button onclick='alert(1)'>Click me</button><img src='x' onerror='alert(2)'>";
    const result = sanitizeTemplateHTML(input);
    // DOMParser may normalize quotes
    expect(result).toMatch(/<button>Click me<\/button><img src=["']x["']>/);
  });

  it("should strip javascript: URIs from href and src", () => {
    const input = "<a href='javascript:alert(1)'>Link</a><img src='javascript:alert(2)'>";
    const result = sanitizeTemplateHTML(input);
    expect(result).toContain('href="#"');
    expect(result).toContain('src="#"');
    expect(result).not.toContain("javascript:");
  });

  it("should handle mixed content correctly", () => {
    const input = "<b>Important</b><script>eval('bad')</script><p onmouseover='steal()'>Hover me</p>";
    const result = sanitizeTemplateHTML(input);
    expect(result).toBe("<b>Important</b><p>Hover me</p>");
  });

  it("should return empty string for non-string input", () => {
    expect(sanitizeTemplateHTML(null as unknown as string)).toBe("");
    expect(sanitizeTemplateHTML(undefined as unknown as string)).toBe("");
    expect(sanitizeTemplateHTML(123 as unknown as string)).toBe("");
  });
});
