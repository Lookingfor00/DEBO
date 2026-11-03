import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

import { JobDetailView } from "@/components/jobs/job-detail-view";
import { loadJobDetailPage } from "@/hooks/pages/load-job-detail-page";
import { getVisitorSession } from "@/lib/auth0";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getVisitorSession();
  const state = await loadJobDetailPage(id, session.sub);
  if (state.isError) {
    throw new Error(state.error ?? "Erreur de chargement.");
  }
  if (!state.data) {
    notFound();
  }
  return (
    <JobDetailView
      job={state.data}
      isAuthenticated={session.isAuthenticated}
      isSaved={state.isSaved}
    />
  );
}
