import { TrackedAnchor } from "@/components/analytics/tracked-link";
import { FavoriteToggleView } from "@/components/jobs/favorite-toggle-view";
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
import type { JobListItemVm } from "@/lib/mappers/map-job-list";

export type FavoritesViewProps = {
  isAuthenticated: boolean;
  items: JobListItemVm[];
  isError: boolean;
  error: string | null;
};

export function FavoritesView({
  isAuthenticated,
  items,
  isError,
  error,
}: FavoritesViewProps) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-heading text-2xl font-medium">Mes favoris</h1>

      {!isAuthenticated ? (
        <section className="mt-10" aria-labelledby="favorites-login-heading">
          <h2
            id="favorites-login-heading"
            className="font-heading text-xl font-medium"
          >
            Connexion requise
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Connectez-vous pour voir et gérer les offres que vous avez
            sauvegardées.
          </p>
          <p className="mt-4">
            <a href="/auth/login" className={buttonVariants()}>
              Connexion
            </a>
          </p>
        </section>
      ) : null}

      {isAuthenticated && isError ? (
        <p className="mt-8 text-destructive">
          {error ?? "Erreur de chargement."}{" "}
          <a
            href="/favorites"
            className={buttonVariants({ variant: "link" })}
          >
            Réessayer
          </a>
        </p>
      ) : null}

      {isAuthenticated && !isError && items.length === 0 ? (
        <Empty className="mt-8">
          <EmptyHeader>
            <EmptyTitle>Aucun favori</EmptyTitle>
            <EmptyDescription>
              Les offres que vous sauvegardez apparaîtront ici.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {isAuthenticated && !isError && items.length > 0 ? (
        <ul className="mt-8 grid gap-4">
          {items.map((job) => (
            <li key={job.id}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <TrackedAnchor
                      href={job.href}
                      ctaId="favorites_item"
                      location="favorites"
                      eventName="job_click"
                      itemId={job.id}
                      className="underline-offset-4 hover:underline"
                    >
                      {job.title ?? "Sans titre"}
                    </TrackedAnchor>
                  </CardTitle>
                  <CardDescription>
                    {[job.company, job.location, job.publishAt]
                      .filter(Boolean)
                      .join(" · ")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FavoriteToggleView
                    itemId={job.id}
                    isAuthenticated
                    isSaved
                  />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
