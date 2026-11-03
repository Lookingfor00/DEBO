import { beforeEach, describe, expect, it, vi } from "vitest";

const activateWithCode = vi.fn();
const createAlertsSessionToken = vi.fn();

vi.mock("@/lib/api/activation-codes", () => {
  class ActivationCodeError extends Error {
    readonly code: string;
    constructor(code: string) {
      super(code);
      this.name = "ActivationCodeError";
      this.code = code;
    }
  }
  return {
    ActivationCodeError,
    activateWithCode: (...args: unknown[]) => activateWithCode(...args),
  };
});

vi.mock("@/lib/alerts/session", () => ({
  ALERTS_SESSION_COOKIE: "jobboard_alerts_session",
  alertsSessionCookieOptions: () => ({
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 100,
  }),
  createAlertsSessionToken: (...args: unknown[]) =>
    createAlertsSessionToken(...args),
}));

describe("POST /api/alerts/activate", () => {
  beforeEach(() => {
    activateWithCode.mockReset();
    createAlertsSessionToken.mockReset();
  });

  it("sets httpOnly session cookie on success", async () => {
    activateWithCode.mockResolvedValue({
      phoneActivationId: "phone-1",
      msisdn: "22372148718",
    });
    createAlertsSessionToken.mockReturnValue("signed-token");
    const { POST } = await import("@/app/api/alerts/activate/route");
    const response = await POST(
      new Request("http://jobboard.test/api/alerts/activate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ msisdn: "72148718", code: "ABC" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(activateWithCode).toHaveBeenCalledWith("72148718", "ABC");
    expect(createAlertsSessionToken).toHaveBeenCalledWith("phone-1");
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("jobboard_alerts_session=signed-token");
    expect(setCookie.toLowerCase()).toContain("httponly");
    await expect(response.json()).resolves.toEqual({
      msisdn: "22372148718",
      activated: true,
    });
  });

  it("returns 403 when code is invalidated", async () => {
    const { ActivationCodeError } = await import("@/lib/api/activation-codes");
    activateWithCode.mockRejectedValue(new ActivationCodeError("code_invalidated"));
    const { POST } = await import("@/app/api/alerts/activate/route");
    const response = await POST(
      new Request("http://jobboard.test/api/alerts/activate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ msisdn: "72148718", code: "BAD" }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("form POST redirects to /alerts with session cookie", async () => {
    activateWithCode.mockResolvedValue({
      phoneActivationId: "phone-1",
      msisdn: "22372148718",
    });
    createAlertsSessionToken.mockReturnValue("signed-token");
    const { POST } = await import("@/app/api/alerts/activate/route");
    const response = await POST(
      new Request("http://jobboard.test/api/alerts/activate", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ msisdn: "72148718", code: "ABC" }),
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://jobboard.test/alerts",
    );
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("jobboard_alerts_session=signed-token");
  });
});

