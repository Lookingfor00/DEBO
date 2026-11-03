import { JobListView } from "@/components/jobs/job-list-view";
import { loadJobListPage } from "@/hooks/pages/load-job-list-page";
import { getVisitorSession } from "@/lib/auth0";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getVisitorSession();
  const state = await loadJobListPage(params, session.sub);
  return (
    <JobListView
      items={state.data.items}
      total={state.data.total}
      filters={state.data.filters}
      isError={state.isError}
      error={state.error}
      isAuthenticated={session.isAuthenticated}
      savedIds={state.data.savedIds}
    />
  );
}
