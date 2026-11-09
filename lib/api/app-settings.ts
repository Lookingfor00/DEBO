import "server-only";

import { createJobboardClient } from "@/lib/api/jobboard-client";

export const WHATSAPP_COPY_ENABLED_KEY = "whatsapp_copy_enabled";

/** LB-010: true only when app_settings value is JSON true; default false. */
export async function getWhatsappCopyEnabled(): Promise<boolean> {
  const supabase = createJobboardClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", WHATSAPP_COPY_ENABLED_KEY)
    .maybeSingle();
  if (error) {
    throw new Error(`app_settings_read_failed:${error.message}`);
  }
  return data?.value === true;
}
