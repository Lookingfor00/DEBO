import { NextResponse } from "next/server";

import {
  InsufficientBalanceError,
  PlanNotFoundError,
  purchasePlan,
} from "@/lib/api/plans";
import { getVisitorSession } from "@/lib/auth0";

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

export async function POST(request: Request) {
  const session = await getVisitorSession();
  if (!session.sub) {
    return unauthorized();
  }

  if (isFormPost(request)) {
    const form = await request.formData();
    void form.get("auth0_sub");
    void form.get("balance_xof");
    const planId = String(form.get("plan_id") ?? "").trim();
    if (!planId) {
      return NextResponse.redirect(
        new URL("/pay?purchase=missing", request.url),
        303,
      );
    }
    try {
      await purchasePlan(session.sub, planId);
      return NextResponse.redirect(
        new URL("/pay?purchased=1", request.url),
        303,
      );
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        return NextResponse.redirect(
          new URL("/pay?purchase=insufficient", request.url),
          303,
        );
      }
      if (error instanceof PlanNotFoundError) {
        return NextResponse.redirect(
          new URL("/pay?purchase=missing", request.url),
          303,
        );
      }
      throw error;
    }
  }

  const body = (await request.json()) as {
    plan_id?: unknown;
    auth0_sub?: unknown;
    balance_xof?: unknown;
  };
  void body.auth0_sub;
  void body.balance_xof;
  const planId = typeof body.plan_id === "string" ? body.plan_id.trim() : "";
  if (!planId) {
    return NextResponse.json({ error: "plan_id_required" }, { status: 400 });
  }
  try {
    const result = await purchasePlan(session.sub, planId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      return NextResponse.json(
        { error: "insufficient_balance" },
        { status: 400 },
      );
    }
    if (error instanceof PlanNotFoundError) {
      return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    }
    throw error;
  }
}
