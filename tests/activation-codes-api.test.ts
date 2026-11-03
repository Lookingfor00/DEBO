import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getActiveSubscription = vi.fn();
const getWalletUnchecked = vi.fn();

vi.mock("@/lib/api/plans", () => ({
  getActiveSubscription: (...args: unknown[]) => getActiveSubscription(...args),
}));

vi.mock("@/lib/api/wallet", () => ({
  getWalletUnchecked: (...args: unknown[]) => getWalletUnchecked(...args),
  normalizePayerMsisdn(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("223")) {
      return digits;
    }
    if (digits.length === 8) {
      return `223${digits}`;
    }
    return digits;
  },
}));

type CodeRow = {
  id: string;
  code_hash: string;
  status: "available" | "used" | "invalidated";
  purchaser_auth0_sub: string | null;
  purchaser_msisdn: string | null;
  used_at?: string | null;
  invalidated_at?: string | null;
};

type PhoneRow = {
  id: string;
  msisdn: string;
  activation_code_id: string;
};

function createFakeClient(codes: CodeRow[], phones: PhoneRow[]) {
  return {
    from(table: string) {
      const state: {
        op: "select" | "insert" | "update";
        filters: Record<string, string>;
        inValues?: string[];
        inColumn?: string;
        limitN?: number;
        payload?: Record<string, unknown>;
        selectCols?: string;
      } = { op: "select", filters: {} };

      const filterCodes = () => {
        let rows = [...codes];
        if (state.filters.purchaser_auth0_sub) {
          rows = rows.filter(
            (r) => r.purchaser_auth0_sub === state.filters.purchaser_auth0_sub,
          );
        }
        if (state.filters.code_hash) {
          rows = rows.filter((r) => r.code_hash === state.filters.code_hash);
        }
        if (state.filters.id) {
          rows = rows.filter((r) => r.id === state.filters.id);
        }
        if (state.filters.status) {
          rows = rows.filter((r) => r.status === state.filters.status);
        }
        if (state.inColumn === "status" && state.inValues) {
          rows = rows.filter((r) => state.inValues!.includes(r.status));
        }
        return rows;
      };

      const filterPhones = () => {
        let rows = [...phones];
        if (state.filters.activation_code_id) {
          rows = rows.filter(
            (r) => r.activation_code_id === state.filters.activation_code_id,
          );
        }
        if (state.filters.id) {
          rows = rows.filter((r) => r.id === state.filters.id);
        }
        return rows;
      };

      const thenable: Record<string, unknown> = {
        select(cols?: string) {
          // After insert/update, .select() only shapes the return payload.
          if (state.op !== "insert" && state.op !== "update") {
            state.op = "select";
          }
          state.selectCols = cols;
          return thenable;
        },
        insert(payload: Record<string, unknown>) {
          state.op = "insert";
          state.payload = payload;
          return thenable;
        },
        update(payload: Record<string, unknown>) {
          state.op = "update";
          state.payload = payload;
          return thenable;
        },
        eq(column: string, value: string) {
          state.filters[column] = value;
          return thenable;
        },
        in(column: string, values: string[]) {
          state.inColumn = column;
          state.inValues = values;
          return thenable;
        },
        limit(n: number) {
          state.limitN = n;
          return thenable;
        },
        maybeSingle() {
          if (table === "activation_codes") {
            const rows = filterCodes();
            return Promise.resolve({ data: rows[0] ?? null, error: null });
          }
          const rows = filterPhones();
          return Promise.resolve({ data: rows[0] ?? null, error: null });
        },
        single() {
          if (state.op === "insert" && table === "activation_codes") {
            const id = `code-${codes.length + 1}`;
            const row: CodeRow = {
              id,
              code_hash: String(state.payload?.code_hash),
              status: "available",
              purchaser_auth0_sub:
                (state.payload?.purchaser_auth0_sub as string) ?? null,
              purchaser_msisdn:
                (state.payload?.purchaser_msisdn as string) ?? null,
            };
            codes.push(row);
            return Promise.resolve({ data: { id }, error: null });
          }
          if (state.op === "insert" && table === "phone_activations") {
            const id = `phone-${phones.length + 1}`;
            const row: PhoneRow = {
              id,
              msisdn: String(state.payload?.msisdn),
              activation_code_id: String(state.payload?.activation_code_id),
            };
            phones.push(row);
            return Promise.resolve({
              data: { id, msisdn: row.msisdn },
              error: null,
            });
          }
          return Promise.resolve({
            data: null,
            error: { message: "unexpected" },
          });
        },
        then(
          resolve: (value: unknown) => unknown,
          reject?: (reason: unknown) => unknown,
        ) {
          if (state.op === "update" && table === "activation_codes") {
            const idx = codes.findIndex((r) => r.id === state.filters.id);
            if (idx >= 0) {
              if (
                state.filters.status &&
                codes[idx].status !== state.filters.status
              ) {
                return Promise.resolve({ data: null, error: null }).then(
                  resolve,
                  reject,
                );
              }
              Object.assign(codes[idx], state.payload);
            }
            return Promise.resolve({ data: null, error: null }).then(
              resolve,
              reject,
            );
          }
          return Promise.resolve({ data: null, error: null }).then(
            resolve,
            reject,
          );
        },
      };
      return thenable;
    },
  };
}

describe("activation-codes api", () => {
  const codes: CodeRow[] = [];
  const phones: PhoneRow[] = [];

  beforeEach(() => {
    vi.resetModules();
    codes.length = 0;
    phones.length = 0;
    getActiveSubscription.mockReset();
    getWalletUnchecked.mockReset();
    process.env.JOBBOARD_SUPABASE_URL = "http://supabase.test";
    process.env.JOBBOARD_SECRET_KEY = "jobboard-secret";
    vi.doMock("@/lib/api/jobboard-client", () => ({
      createJobboardClient: () => createFakeClient(codes, phones),
    }));
  });

  afterEach(() => {
    delete process.env.JOBBOARD_SUPABASE_URL;
    delete process.env.JOBBOARD_SECRET_KEY;
    vi.doUnmock("@/lib/api/jobboard-client");
  });

  it("hashes activation codes stably", async () => {
    const { hashActivationCode } = await import("@/lib/api/activation-codes");
    expect(hashActivationCode("ABC")).toBe(hashActivationCode("ABC"));
    expect(hashActivationCode("ABC")).not.toBe(hashActivationCode("ABD"));
  });

  it("mints a code once for a subscribed purchaser", async () => {
    getActiveSubscription.mockResolvedValue({
      id: "sub-1",
      auth0_sub: "auth0|alice",
      plan_id: "plan-1",
      starts_at: "2026-01-01T00:00:00Z",
      ends_at: "2027-01-01T00:00:00Z",
    });
    getWalletUnchecked.mockResolvedValue({
      payer_msisdn: "22372148718",
      balance_xof: 0,
    });
    const { requestActivationCode } = await import("@/lib/api/activation-codes");
    const minted = await requestActivationCode("auth0|alice");
    expect(minted.code.length).toBeGreaterThanOrEqual(8);
    expect(codes).toHaveLength(1);
    expect(codes[0].status).toBe("available");
    expect(codes[0].purchaser_auth0_sub).toBe("auth0|alice");
    expect(codes[0].purchaser_msisdn).toBe("22372148718");
  });

  it("rejects mint without active subscription", async () => {
    getActiveSubscription.mockResolvedValue(null);
    const { requestActivationCode, NoActiveSubscriptionError } = await import(
      "@/lib/api/activation-codes"
    );
    await expect(requestActivationCode("auth0|alice")).rejects.toBeInstanceOf(
      NoActiveSubscriptionError,
    );
  });

  it("rejects a second mint for the same purchaser", async () => {
    getActiveSubscription.mockResolvedValue({
      id: "sub-1",
      auth0_sub: "auth0|alice",
      plan_id: "plan-1",
      starts_at: "2026-01-01T00:00:00Z",
      ends_at: "2027-01-01T00:00:00Z",
    });
    getWalletUnchecked.mockResolvedValue({
      payer_msisdn: null,
      balance_xof: null,
    });
    const { requestActivationCode, CodeAlreadyIssuedError, hashActivationCode } =
      await import("@/lib/api/activation-codes");
    codes.push({
      id: "existing",
      code_hash: hashActivationCode("ALREADY"),
      status: "available",
      purchaser_auth0_sub: "auth0|alice",
      purchaser_msisdn: null,
    });
    await expect(requestActivationCode("auth0|alice")).rejects.toBeInstanceOf(
      CodeAlreadyIssuedError,
    );
  });

  it("activates available code and restores session for same msisdn", async () => {
    const { activateWithCode, hashActivationCode } = await import(
      "@/lib/api/activation-codes"
    );
    codes.push({
      id: "c1",
      code_hash: hashActivationCode("SECRET1"),
      status: "available",
      purchaser_auth0_sub: "auth0|alice",
      purchaser_msisdn: null,
    });
    const first = await activateWithCode("72148718", "SECRET1");
    expect(first.msisdn).toBe("22372148718");
    expect(codes[0].status).toBe("used");
    expect(phones).toHaveLength(1);

    const second = await activateWithCode("72148718", "SECRET1");
    expect(second.phoneActivationId).toBe(first.phoneActivationId);
  });

  it("rejects activate when code is bound to another msisdn", async () => {
    const { activateWithCode, hashActivationCode, ActivationCodeError } =
      await import("@/lib/api/activation-codes");
    codes.push({
      id: "c1",
      code_hash: hashActivationCode("SECRET2"),
      status: "used",
      purchaser_auth0_sub: "auth0|alice",
      purchaser_msisdn: null,
    });
    phones.push({
      id: "p1",
      msisdn: "22370000001",
      activation_code_id: "c1",
    });
    await expect(activateWithCode("72148718", "SECRET2")).rejects.toMatchObject({
      code: "code_bound_to_other_msisdn",
    });
    await expect(activateWithCode("72148718", "SECRET2")).rejects.toBeInstanceOf(
      ActivationCodeError,
    );
  });

  it("issueActivationCodeForPurchaser maps mint and already-issued", async () => {
    getActiveSubscription.mockResolvedValue({
      id: "sub-1",
      auth0_sub: "auth0|alice",
      plan_id: "plan-1",
      starts_at: "2026-01-01T00:00:00Z",
      ends_at: "2027-01-01T00:00:00Z",
    });
    getWalletUnchecked.mockResolvedValue({
      payer_msisdn: null,
      balance_xof: null,
    });
    const { issueActivationCodeForPurchaser, hashActivationCode } = await import(
      "@/lib/api/activation-codes"
    );
    const first = await issueActivationCodeForPurchaser("auth0|alice");
    expect(first.status).toBe("issued");
    if (first.status === "issued") {
      expect(first.code.length).toBeGreaterThanOrEqual(8);
    }
    codes.push({
      id: "dup",
      code_hash: hashActivationCode("OTHER"),
      status: "available",
      purchaser_auth0_sub: "auth0|alice",
      purchaser_msisdn: null,
    });
    // codes already has the minted row + we pushed another — first mint already
    // left an available row for alice, so second call is already_issued.
    const second = await issueActivationCodeForPurchaser("auth0|alice");
    expect(second).toEqual({ status: "already_issued" });
  });

  it("invalidates a code so activate fails", async () => {
    const {
      invalidateActivationCode,
      activateWithCode,
      hashActivationCode,
      ActivationCodeError,
    } = await import("@/lib/api/activation-codes");
    codes.push({
      id: "c1",
      code_hash: hashActivationCode("TOKILL"),
      status: "available",
      purchaser_auth0_sub: "auth0|alice",
      purchaser_msisdn: null,
    });
    await invalidateActivationCode("TOKILL");
    expect(codes[0].status).toBe("invalidated");
    await expect(activateWithCode("72148718", "TOKILL")).rejects.toBeInstanceOf(
      ActivationCodeError,
    );
  });
});
