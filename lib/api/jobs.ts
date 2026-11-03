import "server-only";

import type { ListJobsInput, ListJobsResult, PublicJobDto } from "@/lib/api/types";

const DEFAULT_LIMIT = 20;

function jobsApiConfig(): { baseUrl: string; key: string } {
  const baseUrl = (process.env.JOBS_API_URL ?? "").replace(/\/$/, "");
  const key = process.env.JOBS_READ_KEY ?? "";
  if (!baseUrl) {
    throw new Error("Missing JOBS_API_URL");
  }
  if (!key) {
    throw new Error("Missing JOBS_READ_KEY");
  }
  return { baseUrl, key };
}

function authHeaders(key: string): HeadersInit {
  return { Authorization: `Bearer ${key}` };
}

export async function listJobs(
  input: ListJobsInput = {},
): Promise<ListJobsResult> {
  const { baseUrl, key } = jobsApiConfig();
  const url = new URL(baseUrl);
  const q = input.q?.trim();
  if (q) url.searchParams.set("q", q);
  const company = input.company?.trim();
  if (company) url.searchParams.set("company", company);
  const location = input.location?.trim();
  if (location) url.searchParams.set("location", location);
  const publishAfter = input.publishAfter?.trim();
  if (publishAfter) url.searchParams.set("publish_after", publishAfter);
  const limit = input.limit ?? DEFAULT_LIMIT;
  url.searchParams.set("limit", String(limit));
  const offset = input.offset ?? 0;
  if (offset > 0) {
    url.searchParams.set("offset", String(offset));
  }

  const response = await fetch(url, { headers: authHeaders(key) });
  if (!response.ok) {
    throw new Error(`jobs_list_failed:${response.status}`);
  }
  const body = (await response.json()) as ListJobsResult;
  return {
    items: body.items ?? [],
    total: body.total ?? 0,
  };
}

export async function getJob(id: string): Promise<PublicJobDto | null> {
  const trimmed = id.trim();
  if (!trimmed) {
    return null;
  }
  const { baseUrl, key } = jobsApiConfig();
  const response = await fetch(`${baseUrl}/${encodeURIComponent(trimmed)}`, {
    headers: authHeaders(key),
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`job_get_failed:${response.status}`);
  }
  const body = (await response.json()) as { item?: PublicJobDto };
  return body.item ?? null;
}
