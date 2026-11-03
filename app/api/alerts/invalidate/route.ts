import { NextResponse } from "next/server";

import {
  ActivationCodeError,
  invalidateActivationCode,
} from "@/lib/api/activation-codes";

function readBearer(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const expected = process.env.ALERTS_INVALIDATE_SECRET?.trim() ?? "";
  if (!expected) {
    return NextResponse.json(
      { error: "invalidate_not_configured" },
      { status: 503 },
    );
  }
  const provided = readBearer(request);
  if (!provided || provided !== expected) {
    return unauthorized();
  }

  const body = (await request.json()) as { code?: unknown };
  const code = typeof body.code === "string" ? body.code : "";

  try {
    await invalidateActivationCode(code);
    return NextResponse.json({ invalidated: true });
  } catch (error) {
    if (error instanceof ActivationCodeError) {
      const status = error.code === "code_not_found" ? 404 : 400;
      return NextResponse.json({ error: error.code }, { status });
    }
    throw error;
  }
}
