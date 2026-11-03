import { AlertsView } from "@/components/alerts/alerts-view";
import { loadAlertsPage } from "@/hooks/pages/load-alerts-page";
import { getAlertsSession } from "@/lib/alerts/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function AlertsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getAlertsSession();
  const activateError = firstParam(params.activate_error) ?? null;
  const saved = firstParam(params.saved) === "1";

  if (!session) {
    return (
      <AlertsView
        isActivated={false}
        msisdn={null}
        keywords=""
        items={[]}
        total={0}
        isError={false}
        error={null}
        activateError={activateError}
      />
    );
  }

  const state = await loadAlertsPage(
    session.phoneActivationId,
    session.msisdn,
  );

  return (
    <AlertsView
      isActivated
      msisdn={state.data.msisdn}
      keywords={state.data.keywords}
      items={state.data.items}
      total={state.data.total}
      isError={state.isError}
      error={state.error}
      saved={saved}
    />
  );
}
