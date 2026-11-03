import "server-only";

import { createClient } from "@supabase/supabase-js";

export function createJobboardClient() {
  const url = process.env.JOBBOARD_SUPABASE_URL ?? "";
  const key = process.env.JOBBOARD_SECRET_KEY ?? "";
  if (!url) {
    throw new Error("Missing JOBBOARD_SUPABASE_URL");
  }
  if (!key) {
    throw new Error("Missing JOBBOARD_SECRET_KEY");
  }
  return createClient(url, key, {
    db: { schema: "jobboard" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
