import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getPhoneActivationById = vi.fn();
const cookieGet = vi.fn();

vi.mock("@/lib/api/activation-codes", () => ({
  getPhoneActivationById: (...args: unknown[]) =>
    getPhoneActivationById(...args),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (...args: unknown[]) => cookieGet(...args),
  }),
}));

describe("alerts session cookie", () => {
  beforeEach(() => {
    vi.resetModules();
    getPhoneActivationById.mockReset();
    cookieGet.mockReset();
    process.env.ALERTS_SESSION_SECRET = "test-session-secret";
  });

  afterEach(() => {
    delete process.env.ALERTS_SESSION_SECRET;
  });

  it("signs and verifies phone activation ids", async () => {
    const { createAlertsSessionToken, verifyAlertsSessionToken } = await import(
      "@/lib/alerts/session"
    );
    const token = createAlertsSessionToken("phone-abc");
    expect(verifyAlertsSessionToken(token)).toBe("phone-abc");
    expect(verifyAlertsSessionToken(token + "x")).toBeNull();
    expect(verifyAlertsSessionToken("not-a-token")).toBeNull();
  });

  it("getAlertsSession returns null when code is invalidated", async () => {
    const { createAlertsSessionToken, getAlertsSession, ALERTS_SESSION_COOKIE } =
      await import("@/lib/alerts/session");
    const token = createAlertsSessionToken("phone-1");
    cookieGet.mockImplementation((name: string) =>
      name === ALERTS_SESSION_COOKIE ? { value: token } : undefined,
    );
    getPhoneActivationById.mockResolvedValue({
      id: "phone-1",
      msisdn: "22372148718",
      codeStatus: "invalidated",
    });
    await expect(getAlertsSession()).resolves.toBeNull();
  });

  it("getAlertsSession returns binding when code is used", async () => {
    const { createAlertsSessionToken, getAlertsSession, ALERTS_SESSION_COOKIE } =
      await import("@/lib/alerts/session");
    const token = createAlertsSessionToken("phone-1");
    cookieGet.mockImplementation((name: string) =>
      name === ALERTS_SESSION_COOKIE ? { value: token } : undefined,
    );
    getPhoneActivationById.mockResolvedValue({
      id: "phone-1",
      msisdn: "22372148718",
      codeStatus: "used",
    });
    await expect(getAlertsSession()).resolves.toEqual({
      phoneActivationId: "phone-1",
      msisdn: "22372148718",
    });
  });
});
