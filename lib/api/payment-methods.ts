import "server-only";

import { createJobboardClient } from "@/lib/api/jobboard-client";
import type { PaymentMethodPublicDto } from "@/lib/api/types";

export async function listEnabledPaymentMethods(): Promise<PaymentMethodPublicDto[]> {
  const supabase = createJobboardClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select("display_name, merchant_msisdn")
    .eq("enabled", true);
  if (error) {
    throw new Error(`payment_methods_list_failed:${error.message}`);
  }
  return ((data ?? []) as PaymentMethodPublicDto[]).map((row) => ({
    display_name: row.display_name,
    merchant_msisdn: row.merchant_msisdn,
  }));
}
