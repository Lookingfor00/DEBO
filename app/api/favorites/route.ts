import { NextResponse } from "next/server";

import {
  listFavoriteIds,
  saveFavorite,
  unsaveFavorite,
} from "@/lib/api/favorites";
import { getVisitorSession } from "@/lib/auth0";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function itemIdFromSearch(request: Request): string {
  return new URL(request.url).searchParams.get("item_id")?.trim() ?? "";
}

async function readBody(request: Request): Promise<{
  itemId: string;
  intent: string;
}> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      item_id?: unknown;
      intent?: unknown;
      auth0_sub?: unknown;
    };
    void body.auth0_sub;
    return {
      itemId: typeof body.item_id === "string" ? body.item_id.trim() : "",
      intent: typeof body.intent === "string" ? body.intent : "save",
    };
  }
  const form = await request.formData();
  return {
    itemId: String(form.get("item_id") ?? "").trim() || itemIdFromSearch(request),
    intent: String(form.get("intent") ?? "save"),
  };
}

function wantsJson(request: Request): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  const accept = request.headers.get("accept") ?? "";
  return contentType.includes("application/json") || accept.includes("application/json");
}

function afterWrite(request: Request) {
  if (wantsJson(request)) {
    return NextResponse.json({ ok: true });
  }
  const referer = request.headers.get("referer");
  const location = referer || new URL("/", request.url).toString();
  return NextResponse.redirect(location, 303);
}

export async function GET() {
  const session = await getVisitorSession();
  if (!session.sub) {
    return unauthorized();
  }
  const itemIds = await listFavoriteIds(session.sub);
  return NextResponse.json({ item_ids: itemIds });
}

export async function POST(request: Request) {
  const session = await getVisitorSession();
  if (!session.sub) {
    return unauthorized();
  }
  const { itemId, intent } = await readBody(request);
  if (!itemId) {
    return NextResponse.json({ error: "item_id_required" }, { status: 400 });
  }
  if (intent === "unsave") {
    await unsaveFavorite(session.sub, itemId);
  } else {
    await saveFavorite(session.sub, itemId);
  }
  return afterWrite(request);
}

export async function DELETE(request: Request) {
  const session = await getVisitorSession();
  if (!session.sub) {
    return unauthorized();
  }
  const itemId = itemIdFromSearch(request);
  if (!itemId) {
    return NextResponse.json({ error: "item_id_required" }, { status: 400 });
  }
  await unsaveFavorite(session.sub, itemId);
  return NextResponse.json({ ok: true });
}
