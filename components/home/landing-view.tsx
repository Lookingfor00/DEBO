import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Briefcase,
  Crown,
  Filter,
  GraduationCap,
  Handshake,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  Smartphone,
  UserCheck,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

import { TrackedAnchor } from "@/components/analytics/tracked-link";
import {
  type LandingIconKey,
  landingGuaranteeBodyAfter,
  landingGuaranteeBodyBefore,
  landingGuaranteeTitle,
  landingHeroLeadAlerts,
  landingHeroLeadWhatsapp,
  landingPlanClosing,
  landingPlanLead,
  landingPlanLeadAlerts,
  landingPlanTitle,
  landingProblemItemsAlertsFixture,
  landingProblemItemsFixture,
  landingProblemLead,
  landingProblemTitle,
  landingSolutionItemsAlertsFixture,
  landingSolutionItemsFixture,
  landingSolutionLead,
  landingSolutionTitle,
  landingStepsAlertsFixture,
  landingStepsFixture,
  landingTeamLead,
  landingTeamLeadAlerts,
  landingTeamMembersFixture,
  landingTeamTitle,
} from "@/components/home/fixtures";
import { LandingReveal } from "@/components/home/landing-reveal";
import {
  LandingStaggerGrid,
  LandingStaggerItem,
} from "@/components/home/landing-stagger-grid";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { PayPlanVm } from "@/lib/mappers/map-pay-page";
import { cn } from "@/lib/utils";

export type LandingViewProps = {
  formspreeUrl: string;
  whatsappChannelUrl: string;
  /** LB-010: when false, hide WhatsApp CTA/copy and use /alerts wording. */
  whatsappCopyEnabled?: boolean;
  plans: PayPlanVm[];
};

const landingIconMap: Record<LandingIconKey, LucideIcon> = {
  search: Search,
  crown: Crown,
  userCheck: UserCheck,
  graduationCap: GraduationCap,
  smartphone: Smartphone,
  users: Users,
  filter: Filter,
  messageCircle: MessageCircle,
  handshake: Handshake,
  userRound: UserRound,
  shieldCheck: ShieldCheck,
  wallet: Wallet,
  badgeCheck: BadgeCheck,
  mail: Mail,
  briefcase: Briefcase,
};

function LandingIcon({
  name,
  className,
}: {
  name: LandingIconKey;
  className?: string;
}) {
  const Icon = landingIconMap[name];
  return (
    <span data-icon={name} className="inline-flex shrink-0">
      <Icon
        aria-hidden
        className={cn("size-5 text-primary", className)}
      />
    </span>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      data-icon="whatsapp"
      className={cn("size-4 shrink-0", className)}
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function StepTitle({
  step,
  title,
  whatsappCopyEnabled,
}: {
  step: number;
  title: string;
  whatsappCopyEnabled: boolean;
}) {
  if (step === 1 && whatsappCopyEnabled) {
    return (
      <CardTitle>
        Explorer nos offres et rejoindre notre canal WhatsApp{" "}
        <strong className="font-semibold">gratuitement</strong>
      </CardTitle>
    );
  }
  if (step === 1 && !whatsappCopyEnabled) {
    return (
      <CardTitle>
        Explorer nos offres <strong className="font-semibold">gratuitement</strong>
      </CardTitle>
    );
  }
  if (step === 3) {
    return (
      <CardTitle>
        Recevez des offres customisées à{" "}
        <strong className="font-semibold">VOTRE</strong> profil.
      </CardTitle>
    );
  }
  return <CardTitle>{title}</CardTitle>;
}

function formatPriceXof(priceXof: number): string {
  return `${priceXof.toLocaleString("fr-FR")} XOF`;
}

const cardHoverMotion =
  "motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md motion-reduce:transition-none";

const ctaHoverMotion =
  "motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:scale-[1.02] motion-reduce:transition-none";

export function LandingView({
  formspreeUrl,
  whatsappChannelUrl,
  whatsappCopyEnabled = false,
  plans,
}: LandingViewProps) {
  const steps = whatsappCopyEnabled
    ? landingStepsFixture
    : landingStepsAlertsFixture;
  const problemItems = whatsappCopyEnabled
    ? landingProblemItemsFixture
    : landingProblemItemsAlertsFixture;
  const solutionItems = whatsappCopyEnabled
    ? landingSolutionItemsFixture
    : landingSolutionItemsAlertsFixture;
  const heroLead = whatsappCopyEnabled
    ? landingHeroLeadWhatsapp
    : landingHeroLeadAlerts;
  const teamLead = whatsappCopyEnabled
    ? landingTeamLead
    : landingTeamLeadAlerts;
  const planLead = whatsappCopyEnabled
    ? landingPlanLead
    : landingPlanLeadAlerts;

  return (
    <main>
      <section className="relative isolate overflow-hidden text-primary-foreground">
        <img
          src="/images/home/hero-img.png"
          alt=""
          className="absolute inset-0 -z-20 size-full object-cover"
        />
        <div
          className="absolute inset-0 -z-10 bg-primary/85"
          aria-hidden
        />
        <LandingReveal className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-16 md:py-24">
          <h1 className="font-heading text-3xl font-medium md:text-4xl">
            Faites-nous confiance pour votre recherche d’emploi.
          </h1>
          <p className="max-w-xl text-primary-foreground/90">{heroLead}</p>
          <div className="flex flex-wrap gap-3">
            <TrackedAnchor
              href="/jobs"
              ctaId="landing_hero_jobs"
              location="landing_hero"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                ctaHoverMotion,
              )}
            >
              <LandingIcon
                name="briefcase"
                className="size-4 text-current"
              />
              Voir les offres
            </TrackedAnchor>
            {!whatsappCopyEnabled ? (
              <TrackedAnchor
                href="/alerts"
                ctaId="landing_hero_alerts"
                location="landing_hero"
                className={cn(
                  buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className:
                      "border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
                  }),
                  ctaHoverMotion,
                )}
              >
                <LandingIcon
                  name="messageCircle"
                  className="size-4 text-current"
                />
                Activer les alertes
              </TrackedAnchor>
            ) : null}
            <TrackedAnchor
              href="/pay"
              ctaId="landing_hero_pay"
              location="landing_hero"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className:
                    "border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
                }),
                ctaHoverMotion,
              )}
            >
              <LandingIcon name="wallet" className="size-4 text-current" />
              S’abonner
            </TrackedAnchor>
          </div>
        </LandingReveal>
      </section>

      <section
        id="comment-ca-marche"
        data-landing-section="steps"
        className="mx-auto max-w-5xl px-6 py-16"
      >
        <LandingReveal>
          <h2 className="font-heading text-2xl font-medium text-foreground">
            Comment nous rejoindre et maximiser vos chances d’avoir un emploi
            cette année ?
          </h2>
        </LandingReveal>
        <LandingStaggerGrid className="mt-8 grid list-none gap-4 p-0 md:grid-cols-3">
          {steps.map((item) => (
            <LandingStaggerItem key={item.step}>
              <Card className={cardHoverMotion}>
                <CardHeader>
                  <LandingIcon name={item.icon} />
                  <p className="text-sm font-medium text-primary">
                    Étape {item.step}
                  </p>
                  <StepTitle
                    step={item.step}
                    title={item.title}
                    whatsappCopyEnabled={whatsappCopyEnabled}
                  />
                  <CardDescription>{item.body}</CardDescription>
                </CardHeader>
                {item.step === 1 ? (
                  <CardContent className="flex flex-wrap gap-2">
                    <TrackedAnchor
                      href="/jobs"
                      ctaId="landing_step1_jobs"
                      location="landing_steps"
                      className={cn(
                        buttonVariants({
                          variant: "secondary",
                          size: "sm",
                        }),
                        ctaHoverMotion,
                      )}
                    >
                      Voir les offres
                    </TrackedAnchor>
                    {!whatsappCopyEnabled ? (
                      <TrackedAnchor
                        href="/alerts"
                        ctaId="landing_step1_alerts"
                        location="landing_steps"
                        className={cn(
                          buttonVariants({ size: "sm" }),
                          ctaHoverMotion,
                        )}
                      >
                        Activer les alertes
                      </TrackedAnchor>
                    ) : (
                      <TrackedAnchor
                        href={whatsappChannelUrl}
                        ctaId="landing_step1_whatsapp"
                        location="landing_steps"
                        outbound
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ size: "sm" }),
                          "bg-[#25D366] text-white hover:bg-[#1ebe57]",
                          ctaHoverMotion,
                        )}
                      >
                        <WhatsAppIcon className="text-white" />
                        Rejoindre les channels WhatsApp
                      </TrackedAnchor>
                    )}
                  </CardContent>
                ) : null}
                {item.step === 2 ? (
                  <CardContent>
                    <TrackedAnchor
                      href="/pay"
                      ctaId="landing_step2_pay"
                      location="landing_steps"
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        ctaHoverMotion,
                      )}
                    >
                      Rejoindre le premium
                    </TrackedAnchor>
                  </CardContent>
                ) : null}
              </Card>
            </LandingStaggerItem>
          ))}
        </LandingStaggerGrid>
      </section>

      <section data-landing-section="problem" className="bg-muted/60">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <LandingReveal>
            <h2 className="font-heading text-2xl font-medium text-foreground">
              {landingProblemTitle}
            </h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              {landingProblemLead}
            </p>
          </LandingReveal>
          <LandingStaggerGrid className="mt-8 grid list-none gap-4 p-0 md:grid-cols-3">
            {problemItems.map((item) => (
              <LandingStaggerItem key={item.title}>
                <Card className={cn("h-full", cardHoverMotion)}>
                  <CardHeader>
                    <LandingIcon name={item.icon} />
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.body}</CardDescription>
                  </CardHeader>
                </Card>
              </LandingStaggerItem>
            ))}
          </LandingStaggerGrid>
        </div>
      </section>

      <section
        data-landing-section="solution"
        className="mx-auto max-w-5xl px-6 py-16"
      >
        <LandingReveal>
          <h2 className="font-heading text-2xl font-medium text-foreground">
            {landingSolutionTitle}
          </h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            {landingSolutionLead}
          </p>
        </LandingReveal>
        <LandingStaggerGrid className="mt-8 grid list-none gap-4 p-0 md:grid-cols-3">
          {solutionItems.map((item) => (
            <LandingStaggerItem key={item.title}>
              <Card className={cn("h-full", cardHoverMotion)}>
                <CardHeader>
                  <LandingIcon name={item.icon} />
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </CardHeader>
              </Card>
            </LandingStaggerItem>
          ))}
        </LandingStaggerGrid>
      </section>

      <section data-landing-section="team" className="bg-muted/60">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <LandingReveal>
            <h2 className="font-heading text-2xl font-medium text-foreground">
              {landingTeamTitle}
            </h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              {teamLead}
            </p>
          </LandingReveal>
          <LandingStaggerGrid className="mt-8 grid list-none gap-6 p-0 sm:grid-cols-2">
            {landingTeamMembersFixture.map((member) => (
              <LandingStaggerItem key={member.name}>
                <Card className={cardHoverMotion}>
                  <CardContent className="flex items-start gap-4 pt-6">
                    <img
                      src={member.imageSrc}
                      alt={member.name}
                      className="size-20 shrink-0 rounded-full object-cover bg-muted"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <LandingIcon name={member.icon} />
                        <p className="font-heading text-lg font-medium text-foreground">
                          {member.name}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {member.role}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </LandingStaggerItem>
            ))}
          </LandingStaggerGrid>
        </div>
      </section>

      <section
        data-landing-section="guarantee"
        className="mx-auto max-w-5xl px-6 py-16"
      >
        <LandingReveal>
          <h2 className="flex items-center gap-2 font-heading text-2xl font-medium text-foreground">
            <LandingIcon name="shieldCheck" />
            {landingGuaranteeTitle}
          </h2>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            {landingGuaranteeBodyBefore}{" "}
            <TrackedAnchor
              href="/remboursement"
              ctaId="landing_guarantee_refund"
              location="landing_guarantee"
              className="font-medium text-primary underline underline-offset-4"
            >
              formulaire
            </TrackedAnchor>{" "}
            {landingGuaranteeBodyAfter}
          </p>
        </LandingReveal>
      </section>

      <section data-landing-section="plan" className="bg-muted/60">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <LandingReveal>
            <h2 className="font-heading text-2xl font-medium text-foreground">
              {landingPlanTitle}
            </h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              {planLead}
            </p>
          </LandingReveal>
          {plans.length === 0 ? (
            <LandingReveal>
              <p className="mt-8 text-muted-foreground">
                Aucun plan disponible
              </p>
            </LandingReveal>
          ) : (
            <LandingStaggerGrid className="mt-8 grid list-none gap-4 p-0 md:grid-cols-2">
              {plans.map((plan) => (
                <LandingStaggerItem key={plan.id}>
                  <Card className={cardHoverMotion}>
                    <CardHeader>
                      <LandingIcon name="wallet" />
                      <CardTitle>{plan.displayName}</CardTitle>
                      <CardDescription>
                        {formatPriceXof(plan.priceXof)} · {plan.durationDays}{" "}
                        jours
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </LandingStaggerItem>
              ))}
            </LandingStaggerGrid>
          )}
          <LandingReveal>
            <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
              {landingPlanClosing}
            </p>
            <div className="mt-8">
              <TrackedAnchor
                href="/pay"
                ctaId="landing_plan_pay"
                location="landing_plan"
                className={cn(buttonVariants({ size: "lg" }), ctaHoverMotion)}
              >
                <LandingIcon
                  name="badgeCheck"
                  className="size-4 text-current"
                />
                Voir les plans et payer
              </TrackedAnchor>
            </div>
          </LandingReveal>
        </div>
      </section>

      <section
        id="contact"
        data-landing-section="contact"
        className="mx-auto max-w-5xl px-6 py-16"
      >
        <LandingReveal>
          <h2 className="flex items-center gap-2 font-heading text-2xl font-medium text-foreground">
            <LandingIcon name="mail" />
            Contactez-nous
          </h2>
          <p className="mt-2 text-muted-foreground">
            Pour toute question ou requête, n’hésitez pas.
          </p>
          <form
            method="POST"
            action={formspreeUrl}
            className="mt-8 max-w-xl"
          >
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="contact-name">Votre nom</FieldLabel>
                <Input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="contact-email">Votre email</FieldLabel>
                <Input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="contact-message">Message</FieldLabel>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={6}
                  className={cn(
                    "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm",
                  )}
                />
              </Field>
              <button
                type="submit"
                className={cn(buttonVariants(), ctaHoverMotion)}
              >
                Envoyer
              </button>
            </FieldGroup>
          </form>
        </LandingReveal>
      </section>
    </main>
  );
}
