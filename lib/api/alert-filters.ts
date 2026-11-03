import "server-only";

import { createJobboardClient } from "@/lib/api/jobboard-client";

export type AlertFiltersDto = {
  keywords: string;
};

type AlertFiltersRow = {
  phone_activation_id: string;
  keywords: string;
};

function emptyFilters(): AlertFiltersDto {
  return { keywords: "" };
}

export async function getAlertFilters(
  phoneActivationId: string,
): Promise<AlertFiltersDto> {
  const id = phoneActivationId.trim();
  if (!id) {
    return emptyFilters();
  }
  const supabase = createJobboardClient();
  const { data, error } = await supabase
    .from("alert_filters")
    .select("keywords")
    .eq("phone_activation_id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`alert_filters_get_failed:${error.message}`);
  }
  if (!data) {
    return emptyFilters();
  }
  return { keywords: String((data as { keywords: string }).keywords ?? "") };
}

export async function putAlertFilters(
  phoneActivationId: string,
  keywords: string,
): Promise<AlertFiltersDto> {
  const id = phoneActivationId.trim();
  if (!id) {
    throw new Error("phone_activation_id_required");
  }
  const normalized = keywords.trim();
  const supabase = createJobboardClient();

  const { data: existing, error: lookupError } = await supabase
    .from("alert_filters")
    .select("phone_activation_id")
    .eq("phone_activation_id", id)
    .maybeSingle();
  if (lookupError) {
    throw new Error(`alert_filters_get_failed:${lookupError.message}`);
  }

  if (existing) {
    const { error } = await supabase
      .from("alert_filters")
      .update({
        keywords: normalized,
        updated_at: new Date().toISOString(),
      })
      .eq("phone_activation_id", id);
    if (error) {
      throw new Error(`alert_filters_put_failed:${error.message}`);
    }
  } else {
    const { error } = await supabase.from("alert_filters").insert({
      phone_activation_id: id,
      keywords: normalized,
    } satisfies Partial<AlertFiltersRow> & {
      phone_activation_id: string;
      keywords: string;
    });
    if (error) {
      throw new Error(`alert_filters_put_failed:${error.message}`);
    }
  }

  return { keywords: normalized };
}
