import { NextResponse } from "next/server";

import {
  CodeAlreadyIssuedError,
  NoActiveSubscriptionError,
  requestActivationCode,
} from "@/lib/api/activation-codes";
import { getVisitorSession } from "@/lib/auth0";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST() {
  const session = await getVisitorSession();
  if (!session.sub) {
    return unauthorized();
  }
  try {
    const minted = await requestActivationCode(session.sub);
    return NextResponse.json({ code: minted.code });
  } catch (error) {
    if (error instanceof NoActiveSubscriptionError) {
      return NextResponse.json(
        { error: "no_active_subscription" },
        { status: 403 },
      );
    }
    if (error instanceof CodeAlreadyIssuedError) {
      return NextResponse.json(
        { error: "code_already_issued" },
        { status: 409 },
      );
    }
    throw error;
  }
}
