import { PushSubscribeView } from "@/components/alerts/push-subscribe-view";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { JobListItemVm } from "@/lib/mappers/map-job-list";

export type AlertsViewProps = {
  isActivated: boolean;
  msisdn: string | null;
  keywords: string;
  items: JobListItemVm[];
  total: number;
  isError: boolean;
  error: string | null;
  activateError?: string | null;
  saved?: boolean;
};

function formatPublishAt(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString("fr-FR");
}

export function AlertsView({
  isActivated,
  msisdn,
  keywords,
  items,
  total,
  isError,
  error,
  activateError = null,
  saved = false,
}: AlertsViewProps) {
  if (!isActivated) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-heading text-2xl font-medium">Alertes</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Activez votre téléphone avec le code reçu après l’achat premium pour
          voir les offres correspondant à vos mots-clés.
        </p>

        {activateError ? (
          <p className="mt-6 text-destructive">
            {activateError === "code_not_found" ||
            activateError === "code_invalidated"
              ? "Code invalide ou révoqué."
              : activateError === "code_bound_to_other_msisdn"
                ? "Ce code est déjà lié à un autre numéro."
                : "Activation impossible. Vérifiez le numéro et le code."}
          </p>
        ) : null}

        <form
          method="post"
          action="/api/alerts/activate"
          className="mt-8 max-w-md"
        >
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="msisdn">Numéro de téléphone</FieldLabel>
              <Input
                id="msisdn"
                name="msisdn"
                autoComplete="tel"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="code">Code d’activation</FieldLabel>
              <Input id="code" name="code" autoComplete="off" required />
            </Field>
            <button type="submit" className={buttonVariants()}>
              Activer
            </button>
          </FieldGroup>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-heading text-2xl font-medium">Alertes</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Connecté avec {msisdn ?? "votre numéro"}. Enregistrez des mots-clés pour
        filtrer les offres.
      </p>

      {saved ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Mots-clés enregistrés.
        </p>
      ) : null}

      {isError ? (
        <p className="mt-6 text-destructive">
          {error ?? "Erreur de chargement."}{" "}
          <a href="/alerts" className="underline">
            Réessayer
          </a>
        </p>
      ) : null}

      <form
        method="post"
        action="/api/alerts/filters"
        className="mt-8 max-w-xl"
      >
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="keywords">Mots-clés</FieldLabel>
            <Input
              id="keywords"
              name="keywords"
              defaultValue={keywords}
              placeholder="ex. développeur bamako"
            />
          </Field>
          <button type="submit" className={buttonVariants()}>
            Enregistrer
          </button>
        </FieldGroup>
      </form>

      <PushSubscribeView hasKeywords={Boolean(keywords.trim())} />

      <section className="mt-12" aria-labelledby="alerts-jobs-heading">
        <h2
          id="alerts-jobs-heading"
          className="font-heading text-xl font-medium"
        >
          Offres correspondantes
        </h2>

        {!keywords.trim() ? (
          <Empty className="mt-6 border border-border">
            <EmptyHeader>
              <EmptyTitle>Aucun filtre</EmptyTitle>
              <EmptyDescription>
                Ajoutez des mots-clés ci-dessus pour afficher les offres
                correspondantes.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : items.length === 0 ? (
          <Empty className="mt-6 border border-border">
            <EmptyHeader>
              <EmptyTitle>Aucune offre</EmptyTitle>
              <EmptyDescription>
                Aucune offre ne correspond à « {keywords.trim()} » pour le
                moment.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {total} résultat{total > 1 ? "s" : ""}
            </p>
            <ul className="mt-6 grid gap-4">
              {items.map((job) => (
                <li key={job.id}>
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <a href={job.href} className="hover:underline">
                          {job.title ?? "Sans titre"}
                        </a>
                      </CardTitle>
                      <CardDescription>
                        {[job.company, job.location]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Publié le {formatPublishAt(job.publishAt)}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}
