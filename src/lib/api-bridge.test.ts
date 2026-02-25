import { describe, it, expect, vi } from "vitest";
import { api } from "./api-bridge";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

describe("API Bridge E2EE", () => {
  it("should encrypt and decrypt a guest ID correctly", async () => {
    const originalId = "AB1234567";

    const encrypted = await api.encryptGuestId(originalId);
    expect(encrypted?.startsWith("e2ee:")).toBe(true);
    expect(encrypted).not.toBe(originalId);

    const decrypted = await api.decryptGuestId(encrypted);
    expect(decrypted).toBe(originalId);
  });

  it("should handle null or empty ID", async () => {
    expect(await api.encryptGuestId("")).toBe("");
    expect(await api.decryptGuestId(null)).toBe(null);
  });

  it("should return original value if not prefixed with e2ee:", async () => {
    const rawId = "NOT_ENCRYPTED";
    expect(await api.decryptGuestId(rawId)).toBe(rawId);
  });
});
