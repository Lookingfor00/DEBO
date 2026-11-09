import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import { favoritesItemFixture } from "@/components/favorites/fixtures";
import { FavoritesView } from "@/components/favorites/favorites-view";

describe("FavoritesView", () => {
  it("prompts login when unauthenticated", () => {
    const html = renderToStaticMarkup(
      createElement(FavoritesView, {
        isAuthenticated: false,
        items: [],
        isError: false,
        error: null,
      }),
    );
    expect(html).toContain("Mes favoris");
    expect(html).toContain("/auth/login");
    expect(html).toContain("Connexion");
    expect(html).not.toContain("Aucun favori");
  });

  it("shows empty state when authenticated with no items", () => {
    const html = renderToStaticMarkup(
      createElement(FavoritesView, {
        isAuthenticated: true,
        items: [],
        isError: false,
        error: null,
      }),
    );
    expect(html).toContain("Aucun favori");
    expect(html).not.toContain("/auth/login");
  });

  it("shows error and retry link", () => {
    const html = renderToStaticMarkup(
      createElement(FavoritesView, {
        isAuthenticated: true,
        items: [],
        isError: true,
        error: "boom",
      }),
    );
    expect(html).toContain("boom");
    expect(html).toContain('href="/favorites"');
    expect(html).toContain("Réessayer");
  });

  it("lists saved jobs with detail links and unsave control", () => {
    const html = renderToStaticMarkup(
      createElement(FavoritesView, {
        isAuthenticated: true,
        items: [favoritesItemFixture],
        isError: false,
        error: null,
      }),
    );
    expect(html).toContain("/jobs/fav-1");
    expect(html).toContain("Ingénieur réseau");
    expect(html).toContain("Retirer des favoris");
  });
});
