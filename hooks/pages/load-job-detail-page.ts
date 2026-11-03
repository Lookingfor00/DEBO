import { listFavoriteIds } from "@/lib/api/favorites";
import { getJob } from "@/lib/api/jobs";
import { mapJobDetail, type JobDetailVm } from "@/lib/mappers/map-job-detail";

export type JobDetailPageState = {
  data: JobDetailVm | undefined;
  isSaved: boolean;
  isError: boolean;
  error: string | null;
};

export async function loadJobDetailPage(
  id: string,
  sub?: string | null,
): Promise<JobDetailPageState> {
  try {
    const job = await getJob(id);
    if (!job) {
      return { data: undefined, isSaved: false, isError: false, error: null };
    }
    const savedIds = sub ? await listFavoriteIds(sub).catch(() => []) : [];
    return {
      data: mapJobDetail(job),
      isSaved: savedIds.includes(job.id),
      isError: false,
      error: null,
    };
  } catch (error) {
    return {
      data: undefined,
      isSaved: false,
      isError: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
