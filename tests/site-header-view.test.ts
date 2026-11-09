import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import { SiteHeaderView } from "@/components/layout/site-header-view";

describe("SiteHeaderView", () => {
  it("shows Accueil, Offres, login when anonymous and never renders sub", () => {
    const html = renderToStaticMarkup(
      createElement(SiteHeaderView, {
        isAuthenticated: false,
        displayName: null,
      }),
    );
    expect(html).toContain('href="/"');
    expect(html).toContain("Accueil");
    expect(html).toContain('href="/jobs"');
    expect(html).toContain("Offres");
    expect(html).toContain('href="/alerts"');
    expect(html).toContain("Alertes");
    expect(html).toContain('href="/pay"');
    expect(html).toContain("Payer");
    expect(html).not.toContain('href="/favorites"');
    expect(html).not.toContain("Favoris");

    expect(html).toContain("/logowhite.png");
    expect(html).toContain("/auth/login");
    expect(html).toContain("Connexion");
    expect(html).not.toContain("auth0|");
    expect(html).not.toContain("/auth/logout");
  });

  it("shows display name, Favoris, and logout when authenticated, without sub", () => {
    const html = renderToStaticMarkup(
      createElement(SiteHeaderView, {
        isAuthenticated: true,
        displayName: "ada@example.com",
      }),
    );
    expect(html).toContain("ada@example.com");
    expect(html).toContain("/auth/logout");
    expect(html).toContain("Déconnexion");
    expect(html).toContain('href="/favorites"');
    expect(html).toContain("Favoris");
    expect(html).not.toContain("auth0|ada");
    expect(html).not.toContain("/auth/login");
  });
});
