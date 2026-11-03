import { NextResponse } from "next/server";

import { putAlertFilters } from "@/lib/api/alert-filters";
import { getAlertsSession } from "@/lib/alerts/session";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function isFormPost(request: Request): boolean {
  const type = request.headers.get("content-type") ?? "";
  return (
    type.includes("application/x-www-form-urlencoded") ||
    type.includes("multipart/form-data")
  );
}

export async function PUT(request: Request) {
  const session = await getAlertsSession();
  if (!session) {
    return unauthorized();
  }
  const body = (await request.json()) as {
    keywords?: unknown;
    phone_activation_id?: unknown;
  };
  void body.phone_activation_id;
  const keywords = typeof body.keywords === "string" ? body.keywords : "";
  const filters = await putAlertFilters(session.phoneActivationId, keywords);
  return NextResponse.json(filters);
}

export async function POST(request: Request) {
  const session = await getAlertsSession();
  if (!session) {
    if (isFormPost(request)) {
      return NextResponse.redirect(new URL("/alerts", request.url), 303);
    }
    return unauthorized();
  }

  let keywords = "";
  if (isFormPost(request)) {
    const form = await request.formData();
    void form.get("phone_activation_id");
    keywords = String(form.get("keywords") ?? "");
    await putAlertFilters(session.phoneActivationId, keywords);
    return NextResponse.redirect(new URL("/alerts?saved=1", request.url), 303);
  }

  const body = (await request.json()) as {
    keywords?: unknown;
    phone_activation_id?: unknown;
  };
  void body.phone_activation_id;
  keywords = typeof body.keywords === "string" ? body.keywords : "";
  const filters = await putAlertFilters(session.phoneActivationId, keywords);
  return NextResponse.json(filters);
}
