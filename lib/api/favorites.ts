import "server-only";

import { createJobboardClient } from "@/lib/api/jobboard-client";

type FavoriteRow = { item_id: string };

export async function listFavoriteIds(sub: string): Promise<string[]> {
  const trimmed = sub.trim();
  if (!trimmed) {
    return [];
  }
  const supabase = createJobboardClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("item_id")
    .eq("auth0_sub", trimmed);
  if (error) {
    throw new Error(`favorites_list_failed:${error.message}`);
  }
  return ((data ?? []) as FavoriteRow[]).map((row) => row.item_id);
}

export async function saveFavorite(sub: string, itemId: string): Promise<void> {
  const auth0Sub = sub.trim();
  const id = itemId.trim();
  if (!auth0Sub || !id) {
    throw new Error("favorites_save_invalid");
  }
  const supabase = createJobboardClient();
  const { error } = await supabase.from("favorites").insert({
    auth0_sub: auth0Sub,
    item_id: id,
  });
  if (error && error.code !== "23505") {
    throw new Error(`favorites_save_failed:${error.message}`);
  }
}

export async function unsaveFavorite(sub: string, itemId: string): Promise<void> {
  const auth0Sub = sub.trim();
  const id = itemId.trim();
  if (!auth0Sub || !id) {
    throw new Error("favorites_unsave_invalid");
  }
  const supabase = createJobboardClient();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("auth0_sub", auth0Sub)
    .eq("item_id", id);
  if (error) {
    throw new Error(`favorites_unsave_failed:${error.message}`);
  }
}
