import "server-only";

import { createJobboardClient } from "@/lib/api/jobboard-client";
import type {
  PlanDto,
  PurchasePlanResult,
  SubscriptionDto,
} from "@/lib/api/types";

export class InsufficientBalanceError extends Error {
  readonly code = "insufficient_balance";

  constructor() {
    super("insufficient_balance");
    this.name = "InsufficientBalanceError";
  }
}

export class PlanNotFoundError extends Error {
  readonly code = "plan_not_found";

  constructor() {
    super("plan_not_found");
    this.name = "PlanNotFoundError";
  }
}

type PlanRow = {
  id: string;
  slug: string;
  display_name: string;
  price_xof: number | string;
  duration_days: number | string;
};

type PurchaseRpcPayload = {
  error?: string;
  balance_xof?: number | string;
  subscription?: {
    id: string;
    auth0_sub: string;
    plan_id: string;
    starts_at: string;
    ends_at: string;
  };
};

function toPlanDto(row: PlanRow): PlanDto {
  return {
    id: row.id,
    slug: row.slug,
    display_name: row.display_name,
    price_xof: Number(row.price_xof),
    duration_days: Number(row.duration_days),
  };
}

function toSubscriptionDto(
  row: NonNullable<PurchaseRpcPayload["subscription"]>,
): SubscriptionDto {
  return {
    id: row.id,
    auth0_sub: row.auth0_sub,
    plan_id: row.plan_id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
  };
}

export async function listEnabledPlans(): Promise<PlanDto[]> {
  const supabase = createJobboardClient();
  const { data, error } = await supabase
    .from("plans")
    .select("id, slug, display_name, price_xof, duration_days")
    .eq("enabled", true);
  if (error) {
    throw new Error(`plans_list_failed:${error.message}`);
  }
  return ((data ?? []) as PlanRow[]).map(toPlanDto);
}

type SubscriptionRow = {
  id: string;
  auth0_sub: string;
  plan_id: string;
  starts_at: string;
  ends_at: string;
};

export async function getActiveSubscription(
  sub: string,
): Promise<SubscriptionDto | null> {
  const auth0Sub = sub.trim();
  if (!auth0Sub) {
    return null;
  }
  const supabase = createJobboardClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, auth0_sub, plan_id, starts_at, ends_at")
    .eq("auth0_sub", auth0Sub)
    .gt("ends_at", new Date().toISOString())
    .maybeSingle();
  if (error) {
    throw new Error(`subscription_get_failed:${error.message}`);
  }
  if (!data) {
    return null;
  }
  return toSubscriptionDto(data as SubscriptionRow);
}

export async function purchasePlan(
  sub: string,
  planId: string,
): Promise<PurchasePlanResult> {
  const auth0Sub = sub.trim();
  const id = planId.trim();
  if (!auth0Sub || !id) {
    throw new Error("purchase_invalid");
  }
  const supabase = createJobboardClient();
  const { data, error } = await supabase.rpc("purchase_plan", {
    p_auth0_sub: auth0Sub,
    p_plan_id: id,
  });
  if (error) {
    throw new Error(`purchase_failed:${error.message}`);
  }
  const payload = (data ?? {}) as PurchaseRpcPayload;
  if (payload.error === "insufficient_balance") {
    throw new InsufficientBalanceError();
  }
  if (payload.error === "plan_not_found") {
    throw new PlanNotFoundError();
  }
  if (payload.error) {
    throw new Error(`purchase_failed:${payload.error}`);
  }
  if (
    payload.balance_xof === undefined ||
    payload.subscription === undefined
  ) {
    throw new Error("purchase_failed:malformed_response");
  }
  return {
    balance_xof: Number(payload.balance_xof),
    subscription: toSubscriptionDto(payload.subscription),
  };
}
