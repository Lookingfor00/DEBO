import { NextResponse } from "next/server";

import { getAlertFilters } from "@/lib/api/alert-filters";
import { upsertPushSubscription } from "@/lib/api/push-subscriptions";
import { getAlertsSession } from "@/lib/alerts/session";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const session = await getAlertsSession();
  if (!session) {
    return unauthorized();
  }

  const filters = await getAlertFilters(session.phoneActivationId);
  if (!filters.keywords.trim()) {
    return NextResponse.json({ error: "keywords_required" }, { status: 400 });
  }

  const body = (await request.json()) as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
    phone_activation_id?: unknown;
  };
  void body.phone_activation_id;

  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const p256dh =
    typeof body.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body.keys?.auth === "string" ? body.keys.auth : "";

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "subscription_invalid" }, { status: 400 });
  }

  const row = await upsertPushSubscription({
    phoneActivationId: session.phoneActivationId,
    endpoint,
    p256dh,
    auth,
  });

  return NextResponse.json({
    id: row.id,
    endpoint: row.endpoint,
  });
}
