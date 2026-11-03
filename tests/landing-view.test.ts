import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import { LandingView } from "@/components/home/landing-view";
import { payPlanFixture } from "@/components/pay/fixtures";
import type { PayPlanVm } from "@/lib/mappers/map-pay-page";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const formspreeUrl = "https://formspree.io/f/xzblkrvw";
const whatsappChannelUrl = "https://chat.whatsapp.com/example-invite";

function renderLanding(plans: PayPlanVm[] = [payPlanFixture]) {
  return renderToStaticMarkup(
    createElement(LandingView, {
      formspreeUrl,
      whatsappChannelUrl,
      plans,
    }),
  );
}

describe("LandingView", () => {
  it("renders hero slogan, opaque overlay, and CTAs to /jobs and /pay", () => {
    const html = renderLanding();
    expect(html).toContain("/images/home/hero-img.png");
    expect(html).toContain("bg-primary/85");
    expect(html).toContain(
      "Faites-nous confiance pour votre recherche d’emploi.",
    );
    expect(html).toContain('href="/jobs"');
    expect(html).toContain("Voir les offres");
    expect(html).toContain('href="/pay"');
    expect(html).toContain("S’abonner");
    expect(html).not.toContain("/jobs/abc");
  });

  it("renders join steps and WhatsApp CTA without the mini-guarantee banner", () => {
    const html = renderLanding();
    expect(html).toContain(
      "Comment nous rejoindre et maximiser vos chances d’avoir un emploi",
    );
    expect(html).not.toContain(
      "Faites-nous confiance et bénéficiez d’une garantie",
    );
    expect(html).toContain("Explorer nos offres");
    expect(html).toContain("gratuitement");
    expect(html).toContain("Laissez-vous convaincre en une minute.");
    expect(html).toContain("Rejoindre les channels WhatsApp");
    expect(html).toContain(`href="${whatsappChannelUrl}"`);
    expect(html).toContain("bg-[#25D366]");
    expect(html).toContain("prix d’un tacos");
    expect(html).toContain("VOTRE");
  });

  it("renders notes sections: problème, solution, équipe, garantie", () => {
    const html = renderLanding();
    expect(html).toContain("Pourquoi ton premier emploi");
    expect(html).toContain("On a la solution");
    expect(html).toContain("On n’est pas une boîte anonyme");
    expect(html).toContain("Garantie remboursée");
    expect(html).toContain("Allassane");
    expect(html).toContain("Mahamane");
    expect(html).toContain("/images/team/allassane.png");
    expect(html).toContain("/images/team/mahamane.png");
    expect(html).toContain('href="/remboursement"');
    expect(html).toContain(">formulaire</a>");
    expect(html).not.toContain("Investissez dans votre carrière");
  });

  it("renders plan cards from props and empty state", () => {
    const withPlan = renderLanding([payPlanFixture]);
    expect(withPlan).toContain("Le plan");
    expect(withPlan).toContain(payPlanFixture.displayName);
    expect(withPlan).toContain("1\u202f000");
    expect(withPlan).toContain("XOF");
    expect(withPlan).toContain("30");
    expect(withPlan).toContain("jours");
    expect(withPlan).toContain("Voir les plans et payer");

    const empty = renderLanding([]);
    expect(empty).toContain("Aucun plan disponible");
    expect(empty).not.toContain(payPlanFixture.displayName);
  });

  it("posts the contact form to Formspree", () => {
    const html = renderLanding();
    expect(html).toContain("Contactez-nous");
    expect(html).toContain(`action="${formspreeUrl}"`);
    expect(html).toContain('method="POST"');
    expect(html).toContain('name="name"');
    expect(html).toContain('name="email"');
    expect(html).toContain('name="message"');
  });

  it("loads enabled plans on the home page without the jobs catalogue", () => {
    const page = readFileSync(join(root, "app/page.tsx"), "utf8");
    expect(page).not.toContain("loadJobListPage");
    expect(page).not.toContain("listJobs");
    expect(page).toContain("listEnabledPlans");
    expect(page).toContain("LandingView");
    expect(page).toContain("FORMSPREE");
    expect(page).toContain("WHATSAPP_CHANNEL_URL");
  });

  it("ships the hero asset under public/", () => {
    const asset = join(root, "public/images/home/hero-img.png");
    expect(readFileSync(asset).byteLength).toBeGreaterThan(1000);
  });

  it("renders Lucide icons in each marketing section and keeps WhatsApp mark", () => {
    const html = renderLanding();
    const sections = [
      "steps",
      "problem",
      "solution",
      "team",
      "guarantee",
      "plan",
      "contact",
    ] as const;

    for (const section of sections) {
      const marker = `data-landing-section="${section}"`;
      const start = html.indexOf(marker);
      expect(start).toBeGreaterThan(-1);
      const slice = html.slice(start, start + 2500);
      expect(slice).toContain("data-icon=");
      expect(slice).toContain("<svg");
    }

    expect(html).toContain('data-icon="whatsapp"');
    expect(html).toContain('data-icon="search"');
    expect(html).toContain('data-icon="graduationCap"');
    expect(html).toContain('data-icon="filter"');
    expect(html).toContain('data-icon="shieldCheck"');
    expect(html).toContain('data-icon="wallet"');
    expect(html).toContain('data-icon="mail"');
    expect(html).toContain('data-icon="briefcase"');
  });

  it("keeps CSS hover polish and leaves the hero image static", () => {
    const html = renderLanding();
    expect(html).toContain("motion-safe:hover:-translate-y-0.5");
    expect(html).toContain("motion-safe:hover:scale-[1.02]");
    expect(html).toContain("motion-reduce:transition-none");
    expect(html).not.toContain("motion-safe:animate-in");

    const imgStart = html.indexOf('src="/images/home/hero-img.png"');
    expect(imgStart).toBeGreaterThan(-1);
    const imgTag = html.slice(
      html.lastIndexOf("<img", imgStart),
      html.indexOf(">", imgStart) + 1,
    );
    expect(imgTag).not.toContain("data-landing-reveal");
    expect(imgTag).not.toContain("motion-safe:");
  });

  it("wires scroll-reveal and stagger wrappers via motion modules", () => {
    const html = renderLanding();
    expect(html).toContain("data-landing-reveal");
    expect(html).toContain("data-landing-stagger");
    expect(html).toContain("data-landing-stagger-item");

    const revealSrc = readFileSync(
      join(root, "components/home/landing-reveal.tsx"),
      "utf8",
    );
    expect(revealSrc).toContain("from \"motion/react\"");
    expect(revealSrc).toContain("whileInView");
    expect(revealSrc).toContain("useReducedMotion");

    const staggerSrc = readFileSync(
      join(root, "components/home/landing-stagger-grid.tsx"),
      "utf8",
    );
    expect(staggerSrc).toContain("from \"motion/react\"");
    expect(staggerSrc).toContain("staggerChildren");
    expect(staggerSrc).toContain("whileInView");
  });
});



