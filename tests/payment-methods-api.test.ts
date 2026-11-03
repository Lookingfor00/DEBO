import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type MethodRow = {
  display_name: string;
  merchant_msisdn: string | null;
  enabled: boolean;
  identify_regex?: string;
};

function createFakeClient(store: MethodRow[]) {
  return {
    from(table: string) {
      expect(table).toBe("payment_methods");
      const state: { columns: string; filters: Record<string, boolean> } = {
        columns: "",
        filters: {},
      };
      const thenable = {
        select(columns: string) {
          state.columns = columns;
          return thenable;
        },
        eq(column: string, value: boolean) {
          state.filters[column] = value;
          return thenable;
        },
        then(
          resolve: (value: { data: unknown; error: null }) => unknown,
          reject?: (reason: unknown) => unknown,
        ) {
          expect(state.columns).toBe("display_name, merchant_msisdn");
          expect(state.columns).not.toMatch(/regex/);
          const rows = store
            .filter((row) =>
              state.filters.enabled === undefined
                ? true
                : row.enabled === state.filters.enabled,
            )
            .map((row) => ({
              display_name: row.display_name,
              merchant_msisdn: row.merchant_msisdn,
            }));
          return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
        },
      };
      return thenable;
    },
  };
}

describe("listEnabledPaymentMethods", () => {
  const store: MethodRow[] = [];

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

  it("returns only enabled methods without regex columns", async () => {
    store.push(
      {
        display_name: "Orange Money",
        merchant_msisdn: "22370000000",
        enabled: true,
        identify_regex: "(?i)OFM MALI",
      },
      {
        display_name: "Moov",
        merchant_msisdn: null,
        enabled: false,
        identify_regex: "Moov",
      },
    );
    const { listEnabledPaymentMethods } = await import("@/lib/api/payment-methods");
    await expect(listEnabledPaymentMethods()).resolves.toEqual([
      { display_name: "Orange Money", merchant_msisdn: "22370000000" },
    ]);
  });
});
