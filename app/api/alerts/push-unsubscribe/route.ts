import { NextResponse } from "next/server";

import { deletePushSubscription } from "@/lib/api/push-subscriptions";
import { getAlertsSession } from "@/lib/alerts/session";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const session = await getAlertsSession();
  if (!session) {
    return unauthorized();
  }

  const body = (await request.json()) as {
    endpoint?: unknown;
    phone_activation_id?: unknown;
  };
  void body.phone_activation_id;
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  if (!endpoint) {
    return NextResponse.json({ error: "subscription_invalid" }, { status: 400 });
  }

  await deletePushSubscription({
    phoneActivationId: session.phoneActivationId,
    endpoint,
  });

  return NextResponse.json({ unsubscribed: true });
}
