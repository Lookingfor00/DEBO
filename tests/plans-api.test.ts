import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type PlanRow = {
  id: string;
  slug: string;
  display_name: string;
  price_xof: number;
  duration_days: number;
  enabled: boolean;
};

function createFakeClient(store: {
  plans: PlanRow[];
  rpcResult?: unknown;
  rpcError?: { message: string } | null;
}) {
  return {
    from(table: string) {
      expect(table).toBe("plans");
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
          expect(state.columns).toBe(
            "id, slug, display_name, price_xof, duration_days",
          );
          const rows = store.plans
            .filter((row) =>
              state.filters.enabled === undefined
                ? true
                : row.enabled === state.filters.enabled,
            )
            .map((row) => ({
              id: row.id,
              slug: row.slug,
              display_name: row.display_name,
              price_xof: row.price_xof,
              duration_days: row.duration_days,
            }));
          return Promise.resolve({ data: rows, error: null }).then(
            resolve,
            reject,
          );
        },
      };
      return thenable;
    },
    rpc(name: string, args: Record<string, unknown>) {
      expect(name).toBe("purchase_plan");
      expect(args).toHaveProperty("p_auth0_sub");
      expect(args).toHaveProperty("p_plan_id");
      return Promise.resolve({
        data: store.rpcResult ?? null,
        error: store.rpcError ?? null,
      });
    },
  };
}

describe("plans api", () => {
  const store: {
    plans: PlanRow[];
    rpcResult?: unknown;
    rpcError?: { message: string } | null;
  } = { plans: [] };

  beforeEach(() => {
    vi.resetModules();
    store.plans = [];
    store.rpcResult = undefined;
    store.rpcError = null;
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

  it("lists only enabled plans", async () => {
    store.plans.push(
      {
        id: "11111111-1111-1111-1111-111111111111",
        slug: "plan_de_test",
        display_name: "Plan de test",
        price_xof: 1000,
        duration_days: 30,
        enabled: true,
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        slug: "hidden",
        display_name: "Hidden",
        price_xof: 5000,
        duration_days: 30,
        enabled: false,
      },
    );
    const { listEnabledPlans } = await import("@/lib/api/plans");
    const plans = await listEnabledPlans();
    expect(plans).toEqual([
      {
        id: "11111111-1111-1111-1111-111111111111",
        slug: "plan_de_test",
        display_name: "Plan de test",
        price_xof: 1000,
        duration_days: 30,
      },
    ]);
  });

  it("purchases via RPC and returns balance + subscription", async () => {
    store.rpcResult = {
      balance_xof: 500,
      subscription: {
        id: "sub-1",
        auth0_sub: "auth0|alice",
        plan_id: "11111111-1111-1111-1111-111111111111",
        starts_at: "2026-10-30T00:00:00Z",
        ends_at: "2026-11-29T00:00:00Z",
      },
    };
    const { purchasePlan } = await import("@/lib/api/plans");
    const result = await purchasePlan(
      "auth0|alice",
      "11111111-1111-1111-1111-111111111111",
    );
    expect(result.balance_xof).toBe(500);
    expect(result.subscription.plan_id).toBe(
      "11111111-1111-1111-1111-111111111111",
    );
  });

  it("throws InsufficientBalanceError without mutating on insufficient funds", async () => {
    store.rpcResult = { error: "insufficient_balance" };
    const { purchasePlan, InsufficientBalanceError } = await import(
      "@/lib/api/plans"
    );
    await expect(
      purchasePlan("auth0|alice", "11111111-1111-1111-1111-111111111111"),
    ).rejects.toBeInstanceOf(InsufficientBalanceError);
  });

  it("throws PlanNotFoundError when RPC reports missing plan", async () => {
    store.rpcResult = { error: "plan_not_found" };
    const { purchasePlan, PlanNotFoundError } = await import("@/lib/api/plans");
    await expect(
      purchasePlan("auth0|alice", "11111111-1111-1111-1111-111111111111"),
    ).rejects.toBeInstanceOf(PlanNotFoundError);
  });

  it("ignores a blank auth0_sub before calling RPC", async () => {
    const { purchasePlan } = await import("@/lib/api/plans");
    await expect(
      purchasePlan("  ", "11111111-1111-1111-1111-111111111111"),
    ).rejects.toThrow(/purchase_invalid/);
  });
});
