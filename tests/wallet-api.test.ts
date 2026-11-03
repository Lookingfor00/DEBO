import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type WalletRow = {
  auth0_sub: string;
  payer_msisdn: string;
  balance_xof: number;
};

function createFakeClient(store: WalletRow[]) {
  return {
    from(table: string) {
      expect(table).toBe("wallets");
      const state: {
        op: "select" | "insert" | "update";
        filters: Record<string, string>;
        payload?: Partial<WalletRow> & { updated_at?: string };
      } = { op: "select", filters: {} };

      const runSelect = () => {
        let rows = store;
        if (state.filters.auth0_sub) {
          rows = rows.filter((row) => row.auth0_sub === state.filters.auth0_sub);
        }
        if (state.filters.payer_msisdn) {
          rows = rows.filter((row) => row.payer_msisdn === state.filters.payer_msisdn);
        }
        return rows[0] ?? null;
      };

      const thenable = {
        select() {
          state.op = "select";
          return thenable;
        },
        insert(payload: { auth0_sub: string; payer_msisdn: string; balance_xof?: number }) {
          const taken = store.some(
            (row) =>
              row.payer_msisdn === payload.payer_msisdn ||
              row.auth0_sub === payload.auth0_sub,
          );
          if (taken) {
            return Promise.resolve({ error: { code: "23505" } });
          }
          store.push({
            auth0_sub: payload.auth0_sub,
            payer_msisdn: payload.payer_msisdn,
            balance_xof: payload.balance_xof ?? 0,
          });
          return Promise.resolve({ error: null });
        },
        update(payload: Partial<WalletRow> & { updated_at?: string }) {
          state.op = "update";
          state.payload = payload;
          return thenable;
        },
        eq(column: string, value: string) {
          state.filters[column] = value;
          return thenable;
        },
        maybeSingle() {
          return Promise.resolve({ data: runSelect(), error: null });
        },
        then(
          resolve: (value: { data: WalletRow | null; error: { code: string } | null }) => unknown,
          reject?: (reason: unknown) => unknown,
        ) {
          if (state.op === "select") {
            return Promise.resolve({ data: runSelect(), error: null }).then(resolve, reject);
          }
          if (state.op === "update") {
            const idx = store.findIndex(
              (row) => row.auth0_sub === state.filters.auth0_sub,
            );
            if (idx >= 0 && state.payload?.payer_msisdn) {
              const next = state.payload.payer_msisdn;
              const clash = store.some(
                (row) =>
                  row.payer_msisdn === next &&
                  row.auth0_sub !== store[idx].auth0_sub,
              );
              if (clash) {
                return Promise.resolve({ data: null, error: { code: "23505" } }).then(
                  resolve,
                  reject,
                );
              }
              store[idx].payer_msisdn = next;
              if (state.payload.balance_xof !== undefined) {
                store[idx].balance_xof = state.payload.balance_xof;
              }
            }
            return Promise.resolve({ data: null, error: null }).then(resolve, reject);
          }
          return Promise.resolve({ data: null, error: null }).then(resolve, reject);
        },
      };
      return thenable;
    },
  };
}

describe("normalizePayerMsisdn", () => {
  it("keeps digits and prefixes 8-digit Mali numbers with 223", async () => {
    const { normalizePayerMsisdn } = await import("@/lib/api/wallet");
    expect(normalizePayerMsisdn("72 14 87 18")).toBe("22372148718");
    expect(normalizePayerMsisdn("22372148718")).toBe("22372148718");
    expect(normalizePayerMsisdn("+223 72 14 87 18")).toBe("22372148718");
  });

  it("treats empty digit strings as invalid", async () => {
    const { normalizePayerMsisdn } = await import("@/lib/api/wallet");
    expect(normalizePayerMsisdn("")).toBe("");
    expect(normalizePayerMsisdn("abc")).toBe("");
  });
});

describe("wallet api", () => {
  const store: WalletRow[] = [];

  beforeEach(() => {
    vi.resetModules();
    store.length = 0;
    process.env.JOBBOARD_SUPABASE_URL = "http://supabase.test";
    process.env.JOBBOARD_SECRET_KEY = "jobboard-secret";
    vi.doMock("@/lib/api/jobboard-client", () => ({
      createJobboardClient: () => createFakeClient(store),
    }));
  });

  afterEach(() => {
    delete process.env.JOBBOARD_SUPABASE_URL;
    delete process.env.JOBBOARD_SECRET_KEY;
    vi.doUnmock("@/lib/api/jobboard-client");
  });

  it("returns null wallet fields when the sub has no row", async () => {
    const { getWallet } = await import("@/lib/api/wallet");
    await expect(getWallet("auth0|alice")).resolves.toEqual({
      payer_msisdn: null,
      balance_xof: null,
    });
  });

  it("reads only the current sub's wallet", async () => {
    store.push(
      {
        auth0_sub: "auth0|alice",
        payer_msisdn: "22370000001",
        balance_xof: 1500,
      },
      {
        auth0_sub: "auth0|bob",
        payer_msisdn: "22370000002",
        balance_xof: 99,
      },
    );
    const { getWallet } = await import("@/lib/api/wallet");
    await expect(getWallet("auth0|alice")).resolves.toEqual({
      payer_msisdn: "22370000001",
      balance_xof: 1500,
    });
  });

  it("inserts a wallet with default balance and does not write a client balance", async () => {
    const { putWallet, getWallet } = await import("@/lib/api/wallet");
    await putWallet("auth0|alice", "72148718");
    expect(store).toEqual([
      {
        auth0_sub: "auth0|alice",
        payer_msisdn: "22372148718",
        balance_xof: 0,
      },
    ]);
    await expect(getWallet("auth0|alice")).resolves.toEqual({
      payer_msisdn: "22372148718",
      balance_xof: 0,
    });
  });

  it("updates own payer number without changing an existing balance", async () => {
    store.push({
      auth0_sub: "auth0|alice",
      payer_msisdn: "22370000001",
      balance_xof: 4200,
    });
    const { putWallet } = await import("@/lib/api/wallet");
    await putWallet("auth0|alice", "72148718");
    expect(store[0]).toEqual({
      auth0_sub: "auth0|alice",
      payer_msisdn: "22372148718",
      balance_xof: 4200,
    });
  });

  it("rejects a payer number already owned by another sub", async () => {
    store.push({
      auth0_sub: "auth0|bob",
      payer_msisdn: "22372148718",
      balance_xof: 0,
    });
    const { putWallet, WalletConflictError } = await import("@/lib/api/wallet");
    await expect(putWallet("auth0|alice", "72148718")).rejects.toBeInstanceOf(
      WalletConflictError,
    );
    expect(store).toHaveLength(1);
    expect(store[0].auth0_sub).toBe("auth0|bob");
  });
});
