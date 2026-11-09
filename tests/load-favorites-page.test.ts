import { beforeEach, describe, expect, it, vi } from "vitest";

const listFavoriteIds = vi.fn();
const getJob = vi.fn();

vi.mock("@/lib/api/favorites", () => ({
  listFavoriteIds: (...args: unknown[]) => listFavoriteIds(...args),
}));

vi.mock("@/lib/api/jobs", () => ({
  getJob: (...args: unknown[]) => getJob(...args),
}));

describe("loadFavoritesPage", () => {
  beforeEach(() => {
    listFavoriteIds.mockReset();
    getJob.mockReset();
  });

  it("returns empty items without calling APIs when sub is missing", async () => {
    const { loadFavoritesPage } = await import(
      "@/hooks/pages/load-favorites-page"
    );
    const state = await loadFavoritesPage(null);
    expect(listFavoriteIds).not.toHaveBeenCalled();
    expect(getJob).not.toHaveBeenCalled();
    expect(state).toMatchObject({
      data: { items: [] },
      isError: false,
      error: null,
    });
  });

  it("maps favorite ids to job list items and drops missing jobs", async () => {
    listFavoriteIds.mockResolvedValue(["a", "b"]);
    getJob.mockImplementation(async (id: string) => {
      if (id === "b") {
        return null;
      }
      return {
        id: "a",
        source_url: null,
        title: "Dev",
        company: "Acme",
        location: "Bamako",
        publish_at: "2026-01-01",
        description_md: null,
        external_id: null,
        deadline: null,
      };
    });
    const { loadFavoritesPage } = await import(
      "@/hooks/pages/load-favorites-page"
    );
    const state = await loadFavoritesPage("auth0|user");
    expect(listFavoriteIds).toHaveBeenCalledWith("auth0|user");
    expect(getJob).toHaveBeenCalledWith("a");
    expect(getJob).toHaveBeenCalledWith("b");
    expect(state.isError).toBe(false);
    expect(state.data.items).toEqual([
      {
        id: "a",
        title: "Dev",
        company: "Acme",
        location: "Bamako",
        publishAt: "2026-01-01",
        href: "/jobs/a",
      },
    ]);
  });

  it("returns error state when listFavoriteIds throws", async () => {
    listFavoriteIds.mockRejectedValue(new Error("favorites_list_failed"));
    const { loadFavoritesPage } = await import(
      "@/hooks/pages/load-favorites-page"
    );
    const state = await loadFavoritesPage("auth0|user");
    expect(state.isError).toBe(true);
    expect(state.error).toContain("favorites_list_failed");
    expect(state.data.items).toEqual([]);
  });
});
