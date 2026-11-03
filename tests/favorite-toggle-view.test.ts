import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import { FavoriteToggleView } from "@/components/jobs/favorite-toggle-view";

describe("FavoriteToggleView", () => {
  it("asks anonymous visitors to log in", () => {
    const html = renderToStaticMarkup(
      createElement(FavoriteToggleView, {
        itemId: "abc",
        isAuthenticated: false,
        isSaved: false,
      }),
    );
    expect(html).toContain("/auth/login");
    expect(html).not.toContain('action="/api/favorites"');
  });

  it("posts save without a client-supplied sub", () => {
    const html = renderToStaticMarkup(
      createElement(FavoriteToggleView, {
        itemId: "abc",
        isAuthenticated: true,
        isSaved: false,
      }),
    );
    expect(html).toContain('action="/api/favorites"');
    expect(html).toContain('name="item_id"');
    expect(html).toContain("Sauver");
    expect(html).not.toContain("auth0_sub");
    expect(html).not.toContain("auth0|");
  });
});
