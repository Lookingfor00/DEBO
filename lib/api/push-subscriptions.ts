import "server-only";

import { createJobboardClient } from "@/lib/api/jobboard-client";

export type PushSubscriptionRow = {
  id: string;
  phone_activation_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushSubscriptionWithKeywords = PushSubscriptionRow & {
  keywords: string;
};

export async function upsertPushSubscription(input: {
  phoneActivationId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<PushSubscriptionRow> {
  const phoneActivationId = input.phoneActivationId.trim();
  const endpoint = input.endpoint.trim();
  const p256dh = input.p256dh.trim();
  const auth = input.auth.trim();
  if (!phoneActivationId || !endpoint || !p256dh || !auth) {
    throw new Error("push_subscription_invalid");
  }

  const supabase = createJobboardClient();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        phone_activation_id: phoneActivationId,
        endpoint,
        p256dh,
        auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    )
    .select("id, phone_activation_id, endpoint, p256dh, auth")
    .single();

  if (error || !data) {
    throw new Error(
      `push_subscription_upsert_failed:${error?.message ?? "missing"}`,
    );
  }

  return data as PushSubscriptionRow;
}

export async function deletePushSubscription(input: {
  phoneActivationId: string;
  endpoint: string;
}): Promise<void> {
  const phoneActivationId = input.phoneActivationId.trim();
  const endpoint = input.endpoint.trim();
  if (!phoneActivationId || !endpoint) {
    throw new Error("push_subscription_invalid");
  }

  const supabase = createJobboardClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("phone_activation_id", phoneActivationId)
    .eq("endpoint", endpoint);

  if (error) {
    throw new Error(`push_subscription_delete_failed:${error.message}`);
  }
}

export async function deletePushSubscriptionById(id: string): Promise<void> {
  const trimmed = id.trim();
  if (!trimmed) return;
  const supabase = createJobboardClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("id", trimmed);
  if (error) {
    throw new Error(`push_subscription_delete_failed:${error.message}`);
  }
}

export async function listPushSubscriptionsWithKeywords(): Promise<
  PushSubscriptionWithKeywords[]
> {
  const supabase = createJobboardClient();
  const { data: subs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("id, phone_activation_id, endpoint, p256dh, auth");

  if (subsError) {
    throw new Error(`push_subscription_list_failed:${subsError.message}`);
  }

  const rows = (subs ?? []) as PushSubscriptionRow[];
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((row) => row.phone_activation_id))];
  const { data: filters, error: filtersError } = await supabase
    .from("alert_filters")
    .select("phone_activation_id, keywords")
    .in("phone_activation_id", ids);

  if (filtersError) {
    throw new Error(`alert_filters_list_failed:${filtersError.message}`);
  }

  const keywordsByPhone = new Map<string, string>();
  for (const filter of filters ?? []) {
    const phoneId = String(
      (filter as { phone_activation_id: string }).phone_activation_id,
    );
    const keywords = String(
      (filter as { keywords: string }).keywords ?? "",
    ).trim();
    keywordsByPhone.set(phoneId, keywords);
  }

  return rows
    .map((row) => ({
      ...row,
      keywords: keywordsByPhone.get(row.phone_activation_id) ?? "",
    }))
    .filter((row) => row.keywords.length > 0);
}
