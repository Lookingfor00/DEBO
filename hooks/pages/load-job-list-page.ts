import { listFavoriteIds } from "@/lib/api/favorites";
import { listJobs } from "@/lib/api/jobs";
import type { JobListFilters } from "@/lib/api/types";
import { mapJobList, type JobListItemVm } from "@/lib/mappers/map-job-list";

export type { JobListFilters };

export type JobListPageData = {
  items: JobListItemVm[];
  total: number;
  filters: JobListFilters;
  savedIds: string[];
};

export type JobListPageState = {
  data: JobListPageData;
  isError: boolean;
  error: string | null;
};

const DEFAULT_LIMIT = 20;

function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }
  return (value ?? "").trim();
}

function intParam(value: string | string[] | undefined, fallback: number): number {
  const raw = param(value);
  if (!raw) {
    return fallback;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

export async function loadJobListPage(
  searchParams: Record<string, string | string[] | undefined>,
  sub?: string | null,
): Promise<JobListPageState> {
  const filters: JobListFilters = {
    q: param(searchParams.q),
    company: param(searchParams.company),
    location: param(searchParams.location),
    publishAfter: param(searchParams.publish_after),
    limit: intParam(searchParams.limit, DEFAULT_LIMIT) || DEFAULT_LIMIT,
    offset: intParam(searchParams.offset, 0),
  };

  try {
    const result = await listJobs({
      q: filters.q || null,
      company: filters.company || null,
      location: filters.location || null,
      publishAfter: filters.publishAfter || null,
      limit: filters.limit,
      offset: filters.offset,
    });
    const savedIds = sub ? await listFavoriteIds(sub).catch(() => []) : [];
    return {
      data: {
        items: mapJobList(result.items),
        total: result.total,
        filters,
        savedIds,
      },
      isError: false,
      error: null,
    };
  } catch (error) {
    return {
      data: { items: [], total: 0, filters, savedIds: [] },
      isError: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
