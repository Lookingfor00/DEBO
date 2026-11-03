import type { JobListFilters } from "@/lib/api/types";

export function jobListQueryString(
  filters: JobListFilters,
  offset = filters.offset,
): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.company) params.set("company", filters.company);
  if (filters.location) params.set("location", filters.location);
  if (filters.publishAfter) params.set("publish_after", filters.publishAfter);
  if (filters.limit !== 20) params.set("limit", String(filters.limit));
  if (offset > 0) params.set("offset", String(offset));
  const qs = params.toString();
  return qs ? `/jobs?${qs}` : "/jobs";
}
