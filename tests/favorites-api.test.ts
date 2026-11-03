import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type FavoriteRow = { auth0_sub: string; item_id: string };

function createFakeClient(store: FavoriteRow[]) {
  return {
    from(table: string) {
      expect(table).toBe("favorites");
      const state: {
        op: "select" | "insert" | "delete";
        filters: Record<string, string>;
        payload?: { auth0_sub: string; item_id: string };
      } = { op: "select", filters: {} };

      const thenable = {
        select() {
          state.op = "select";
          return thenable;
        },
        insert(payload: { auth0_sub: string; item_id: string }) {
          state.op = "insert";
          state.payload = payload;
          store.push(payload);
          return Promise.resolve({ error: null });
        },
        delete() {
          state.op = "delete";
          return thenable;
        },
        eq(column: string, value: string) {
          state.filters[column] = value;
          return thenable;
        },
        then(
          resolve: (value: { data: { item_id: string }[] | null; error: null }) => unknown,
          reject?: (reason: unknown) => unknown,
        ) {
          if (state.op === "select") {
            const data = store
              .filter((row) => row.auth0_sub === state.filters.auth0_sub)
              .map((row) => ({ item_id: row.item_id }));
            return Promise.resolve({ data, error: null }).then(resolve, reject);
          }
          if (state.op === "delete") {
            const keep = store.filter(
              (row) =>
                !(
                  row.auth0_sub === state.filters.auth0_sub &&
                  row.item_id === state.filters.item_id
                ),
            );
            store.length = 0;
            store.push(...keep);
          }
          return Promise.resolve({ data: null, error: null }).then(resolve, reject);
        },
      };
      return thenable;
    },
  };
}

describe("favorites api", () => {
  const store: FavoriteRow[] = [];

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

  it("lists only the current sub's item ids", async () => {
    store.push(
      { auth0_sub: "auth0|alice", item_id: "aaa" },
      { auth0_sub: "auth0|bob", item_id: "bbb" },
    );
    const { listFavoriteIds } = await import("@/lib/api/favorites");
    expect(await listFavoriteIds("auth0|alice")).toEqual(["aaa"]);
  });

  it("saves with the provided session sub, not another user", async () => {
    const { saveFavorite, listFavoriteIds } = await import("@/lib/api/favorites");
    await saveFavorite("auth0|alice", "item-1");
    expect(store).toEqual([
      { auth0_sub: "auth0|alice", item_id: "item-1" },
    ]);
    expect(await listFavoriteIds("auth0|bob")).toEqual([]);
  });
});
