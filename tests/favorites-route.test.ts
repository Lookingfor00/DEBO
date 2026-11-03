import { beforeEach, describe, expect, it, vi } from "vitest";

const getVisitorSession = vi.fn();
const listFavoriteIds = vi.fn();
const saveFavorite = vi.fn();
const unsaveFavorite = vi.fn();

vi.mock("@/lib/auth0", () => ({
  getVisitorSession: (...args: unknown[]) => getVisitorSession(...args),
}));

vi.mock("@/lib/api/favorites", () => ({
  listFavoriteIds: (...args: unknown[]) => listFavoriteIds(...args),
  saveFavorite: (...args: unknown[]) => saveFavorite(...args),
  unsaveFavorite: (...args: unknown[]) => unsaveFavorite(...args),
}));

describe("GET/POST/DELETE /api/favorites", () => {
  beforeEach(() => {
    getVisitorSession.mockReset();
    listFavoriteIds.mockReset();
    saveFavorite.mockReset();
    unsaveFavorite.mockReset();
  });

  it("rejects unauthenticated writes", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: false,
      displayName: null,
      sub: null,
    });
    const { POST } = await import("@/app/api/favorites/route");
    const response = await POST(
      new Request("http://jobboard.test/api/favorites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ item_id: "abc" }),
      }),
    );
    expect(response.status).toBe(401);
    expect(saveFavorite).not.toHaveBeenCalled();
  });

  it("ignores a client-supplied auth0_sub and uses the session sub", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "ada",
      sub: "auth0|alice",
    });
    saveFavorite.mockResolvedValue(undefined);
    const { POST } = await import("@/app/api/favorites/route");
    const response = await POST(
      new Request("http://jobboard.test/api/favorites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          item_id: "abc",
          auth0_sub: "auth0|mallory",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(saveFavorite).toHaveBeenCalledWith("auth0|alice", "abc");
    expect(saveFavorite).not.toHaveBeenCalledWith("auth0|mallory", "abc");
  });

  it("lists favorite ids for the session sub only", async () => {
    getVisitorSession.mockResolvedValue({
      isAuthenticated: true,
      displayName: "ada",
      sub: "auth0|alice",
    });
    listFavoriteIds.mockResolvedValue(["aaa"]);
    const { GET } = await import("@/app/api/favorites/route");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(listFavoriteIds).toHaveBeenCalledWith("auth0|alice");
    await expect(response.json()).resolves.toEqual({ item_ids: ["aaa"] });
  });
});
