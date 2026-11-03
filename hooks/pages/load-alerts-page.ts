import { getAlertFilters } from "@/lib/api/alert-filters";
import { listJobs } from "@/lib/api/jobs";
import { mapJobList, type JobListItemVm } from "@/lib/mappers/map-job-list";

export type AlertsPageVm = {
  msisdn: string;
  keywords: string;
  items: JobListItemVm[];
  total: number;
};

export type AlertsPageState = {
  data: AlertsPageVm;
  isError: boolean;
  error: string | null;
};

export async function loadAlertsPage(
  phoneActivationId: string,
  msisdn: string,
): Promise<AlertsPageState> {
  try {
    const filters = await getAlertFilters(phoneActivationId);
    const keywords = filters.keywords.trim();
    if (!keywords) {
      return {
        data: {
          msisdn,
          keywords: "",
          items: [],
          total: 0,
        },
        isError: false,
        error: null,
      };
    }
    const result = await listJobs({ q: keywords, limit: 20 });
    return {
      data: {
        msisdn,
        keywords: filters.keywords,
        items: mapJobList(result.items),
        total: result.total,
      },
      isError: false,
      error: null,
    };
  } catch (error) {
    return {
      data: {
        msisdn,
        keywords: "",
        items: [],
        total: 0,
      },
      isError: true,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
