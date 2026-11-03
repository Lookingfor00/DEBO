import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { payPageFixture, payPlanFixture } from "@/components/pay/fixtures";
import { PayView } from "@/components/pay/pay-view";

describe("PayView", () => {
  it("shows methods and login CTA without wallet or purchase forms", () => {
    const html = renderToStaticMarkup(
      createElement(PayView, {
        isAuthenticated: false,
        payerMsisdn: null,
        balanceXof: null,
        merchants: payPageFixture.merchants,
        plans: payPageFixture.plans,
        activeSubscription: null,
        supportMsisdn: null,
        isError: false,
        error: null,
      }),
    );
    expect(html).toContain("/auth/login");
    expect(html).toContain("Méthodes de paiement");
    expect(html).toContain("Orange Money");
    expect(html).toContain("Connexion requise");
    expect(html).toContain("14 h et 17 h");
    expect(html).not.toContain('action="/api/wallet"');
    expect(html).not.toContain('action="/api/plans/purchase"');
  });

  it("shows stepped flow and purchase when balance covers the plan", () => {
    const html = renderToStaticMarkup(
      createElement(PayView, {
        isAuthenticated: true,
        payerMsisdn: payPageFixture.payerMsisdn,
        balanceXof: payPageFixture.balanceXof,
        merchants: payPageFixture.merchants,
        plans: payPageFixture.plans,
        activeSubscription: null,
        supportMsisdn: null,
        isError: false,
        error: null,
      }),
    );
    expect(html).toContain("Étape 1");
    expect(html).toContain("Étape 2 — Payer avec le numéro 22372148718");
    expect(html).toContain("Étape 3 — Confirmer la référence SMS");
    expect(html).toContain("Étape 4");
    expect(html).toContain("Plan de test");
    expect(html).toContain("1500");
    expect(html).toContain("22370000000");
    expect(html).toContain('action="/api/wallet"');
    expect(html).toContain('action="/api/wallet/confirm-invoice"');
    expect(html).toContain('name="reference"');
    expect(html).toContain('action="/api/plans/purchase"');
    expect(html).toContain(`value="${payPlanFixture.id}"`);
    expect(html).toContain("Acheter");
    expect(html).not.toContain("auth0_sub");
    expect(html).not.toContain('name="balance_xof"');
  });

  it("shows invoice gate copy when balance requires a reference", () => {
    const html = renderToStaticMarkup(
      createElement(PayView, {
        isAuthenticated: true,
        payerMsisdn: "22372148718",
        balanceXof: null,
        merchants: payPageFixture.merchants,
        plans: payPageFixture.plans,
        activeSubscription: null,
        supportMsisdn: null,
        isError: false,
        error: null,
        invoiceRefRequired: true,
      }),
    );
    expect(html).toContain("dernière référence SMS");
    expect(html).toContain('action="/api/wallet/confirm-invoice"');
  });

  it("asks to credit more when balance is below plan price", () => {
    const html = renderToStaticMarkup(
      createElement(PayView, {
        isAuthenticated: true,
        payerMsisdn: "22372148718",
        balanceXof: 200,
        merchants: payPageFixture.merchants,
        plans: payPageFixture.plans,
        activeSubscription: null,
        supportMsisdn: null,
        isError: false,
        error: null,
      }),
    );
    expect(html).toContain("Créditez encore 800 XOF");
    expect(html).not.toContain('action="/api/plans/purchase"');
  });

  it("shows subscription status instead of buy when already premium", () => {
    const html = renderToStaticMarkup(
      createElement(PayView, {
        isAuthenticated: true,
        payerMsisdn: "22372148718",
        balanceXof: 1500,
        merchants: [],
        plans: payPageFixture.plans,
        activeSubscription: { endsAt: "2026-11-29T00:00:00.000Z" },
        supportMsisdn: null,
        isError: false,
        error: null,
      }),
    );
    expect(html).toContain("Premium actif jusqu’au");
    expect(html).not.toContain('action="/api/plans/purchase"');
  });

  it("shows support number only when provided", () => {
    const without = renderToStaticMarkup(
      createElement(PayView, {
        isAuthenticated: false,
        payerMsisdn: null,
        balanceXof: null,
        merchants: [],
        plans: [],
        activeSubscription: null,
        supportMsisdn: null,
        isError: false,
        error: null,
      }),
    );
    expect(without).toContain("14 h et 17 h");
    expect(without).not.toContain("22370001111");

    const withSupport = renderToStaticMarkup(
      createElement(PayView, {
        isAuthenticated: false,
        payerMsisdn: null,
        balanceXof: null,
        merchants: [],
        plans: [],
        activeSubscription: null,
        supportMsisdn: "22370001111",
        isError: false,
        error: null,
      }),
    );
    expect(withSupport).toContain("22370001111");
  });

  it("shows conflict copy when the number is taken", () => {
    const html = renderToStaticMarkup(
      createElement(PayView, {
        isAuthenticated: true,
        payerMsisdn: null,
        balanceXof: null,
        merchants: [],
        plans: [],
        activeSubscription: null,
        supportMsisdn: null,
        isError: false,
        error: null,
        conflict: true,
      }),
    );
    expect(html).toContain("déjà utilisé");
  });

  it("shows one-shot activation code after purchase", () => {
    const html = renderToStaticMarkup(
      createElement(PayView, {
        isAuthenticated: true,
        payerMsisdn: "22372148718",
        balanceXof: 500,
        merchants: [],
        plans: [],
        activeSubscription: { endsAt: "2026-11-29T00:00:00.000Z" },
        supportMsisdn: null,
        isError: false,
        error: null,
        purchased: true,
        activationCode: "SAVECODE123",
      }),
    );
    expect(html).toContain("Conservez ce code");
    expect(html).toContain("SAVECODE123");
    expect(html).toContain('id="activation_code_display"');
    expect(html).not.toContain("ne peut pas être réaffiché");
  });

  it("shows safe already-issued message without inventing a code", () => {
    const html = renderToStaticMarkup(
      createElement(PayView, {
        isAuthenticated: true,
        payerMsisdn: "22372148718",
        balanceXof: 500,
        merchants: [],
        plans: [],
        activeSubscription: { endsAt: "2026-11-29T00:00:00.000Z" },
        supportMsisdn: null,
        isError: false,
        error: null,
        purchased: true,
        activationCodeAlreadyIssued: true,
      }),
    );
    expect(html).toContain("déjà été émis");
    expect(html).toContain("ne peut pas être réaffiché");
    expect(html).not.toContain('id="activation_code_display"');
  });
});

