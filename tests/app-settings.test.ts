import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const createJobboardClient = vi.fn();

vi.mock("@/lib/api/jobboard-client", () => ({
  createJobboardClient: (...args: unknown[]) => createJobboardClient(...args),
}));

describe("getWhatsappCopyEnabled", () => {
  beforeEach(() => {
    createJobboardClient.mockReset();
  });

  it("returns true only for JSON true", async () => {
    createJobboardClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { value: true }, error: null }),
          }),
        }),
      }),
    });
    const { getWhatsappCopyEnabled } = await import("@/lib/api/app-settings");
    await expect(getWhatsappCopyEnabled()).resolves.toBe(true);
  });

  it("returns false for false, missing, or non-boolean", async () => {
    const { getWhatsappCopyEnabled, WHATSAPP_COPY_ENABLED_KEY } = await import(
      "@/lib/api/app-settings"
    );
    expect(WHATSAPP_COPY_ENABLED_KEY).toBe("whatsapp_copy_enabled");

    createJobboardClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { value: false }, error: null }),
          }),
        }),
      }),
    });
    await expect(getWhatsappCopyEnabled()).resolves.toBe(false);

    createJobboardClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    });
    await expect(getWhatsappCopyEnabled()).resolves.toBe(false);
  });

  it("throws on supabase error", async () => {
    createJobboardClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: null,
              error: { message: "boom" },
            }),
          }),
        }),
      }),
    });
    const { getWhatsappCopyEnabled } = await import("@/lib/api/app-settings");
    await expect(getWhatsappCopyEnabled()).rejects.toThrow(
      /app_settings_read_failed/,
    );
  });
});
