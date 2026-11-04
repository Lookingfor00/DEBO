import "server-only";

import { createJobboardClient } from "@/lib/api/jobboard-client";

export async function hasPushSent(
  subscriptionId: string,
  itemId: string,
): Promise<boolean> {
  const sid = subscriptionId.trim();
  const iid = itemId.trim();
  if (!sid || !iid) return false;

  const supabase = createJobboardClient();
  const { data, error } = await supabase
    .from("push_sent")
    .select("subscription_id")
    .eq("subscription_id", sid)
    .eq("item_id", iid)
    .maybeSingle();

  if (error) {
    throw new Error(`push_sent_lookup_failed:${error.message}`);
  }
  return data != null;
}

export async function markPushSent(
  subscriptionId: string,
  itemId: string,
): Promise<void> {
  const sid = subscriptionId.trim();
  const iid = itemId.trim();
  if (!sid || !iid) {
    throw new Error("push_sent_invalid");
  }

  const supabase = createJobboardClient();
  const { error } = await supabase.from("push_sent").upsert(
    {
      subscription_id: sid,
      item_id: iid,
      sent_at: new Date().toISOString(),
    },
    { onConflict: "subscription_id,item_id" },
  );

  if (error) {
    throw new Error(`push_sent_insert_failed:${error.message}`);
  }
}
