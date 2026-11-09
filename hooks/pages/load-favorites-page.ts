import { listFavoriteIds } from "@/lib/api/favorites";
import { getJob } from "@/lib/api/jobs";
import { mapJobList, type JobListItemVm } from "@/lib/mappers/map-job-list";

export type FavoritesPageData = {
  items: JobListItemVm[];
};

export type FavoritesPageState = {
  data: FavoritesPageData;
  isError: boolean;
  error: string | null;
};

export async function loadFavoritesPage(
  sub: string | null | undefined,
): Promise<FavoritesPageState> {
  const trimmed = sub?.trim() ?? "";
  if (!trimmed) {
    return {
      data: { items: [] },
      isError: false,
      error: null,
    };
  }

  try {
    const ids = await listFavoriteIds(trimmed);
    const jobs = await Promise.all(ids.map((id) => getJob(id)));
    const found = jobs.filter((job) => job != null);
    return {
      data: { items: mapJobList(found) },
      isError: false,
      error: null,
    };
  } catch (error) {
    return {
      data: { items: [] },
      isError: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
