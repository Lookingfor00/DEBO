import { NextResponse } from "next/server";

import { runPushDispatch } from "@/lib/api/push-dispatch";

export const runtime = "nodejs";

function readBearer(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const expected = process.env.ALERTS_PUSH_DISPATCH_SECRET?.trim() ?? "";
  if (!expected) {
    return NextResponse.json(
      { error: "dispatch_not_configured" },
      { status: 503 },
    );
  }
  const provided = readBearer(request);
  if (!provided || provided !== expected) {
    return unauthorized();
  }

  try {
    const result = await runPushDispatch();
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "push_dispatch_failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json({ error: "dispatch_failed" }, { status: 500 });
  }
}
