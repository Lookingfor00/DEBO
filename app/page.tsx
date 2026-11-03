import { LandingView } from "@/components/home/landing-view";
import { listEnabledPlans } from "@/lib/api/plans";
import type { PayPlanVm } from "@/lib/mappers/map-pay-page";

const DEFAULT_FORMSPREE_URL = "https://formspree.io/f/xzblkrvw";
const DEFAULT_WHATSAPP_CHANNEL_URL = "https://wa.me/22374469859";

export default async function HomePage() {
  const formspreeUrl =
    process.env.NEXT_PUBLIC_FORMSPREE_URL?.trim() || DEFAULT_FORMSPREE_URL;
  const whatsappChannelUrl =
    process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL?.trim() ||
    DEFAULT_WHATSAPP_CHANNEL_URL;

  let plans: PayPlanVm[] = [];
  try {
    const rows = await listEnabledPlans();
    plans = rows.map((plan) => ({
      id: plan.id,
      slug: plan.slug,
      displayName: plan.display_name,
      priceXof: plan.price_xof,
      durationDays: plan.duration_days,
    }));
  } catch {
    plans = [];
  }

  return (
    <LandingView
      formspreeUrl={formspreeUrl}
      whatsappChannelUrl={whatsappChannelUrl}
      plans={plans}
    />
  );
}
