import { FavoriteToggleView } from "@/components/jobs/favorite-toggle-view";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import type { JobListFilters } from "@/lib/api/types";
import { jobListQueryString } from "@/lib/jobs-query-string";
import type { JobListItemVm } from "@/lib/mappers/map-job-list";

export type JobListViewProps = {
  items: JobListItemVm[];
  total: number;
  filters: JobListFilters;
  isError: boolean;
  error: string | null;
  isAuthenticated?: boolean;
  savedIds?: string[];
};

export function JobListView({
  items,
  total,
  filters,
  isError,
  error,
  isAuthenticated = false,
  savedIds = [],
}: JobListViewProps) {
  const retryHref = jobListQueryString(filters);
  const prevHref =
    filters.offset > 0
      ? jobListQueryString(
          filters,
          Math.max(0, filters.offset - filters.limit),
        )
      : null;
  const nextHref =
    filters.offset + items.length < total
      ? jobListQueryString(filters, filters.offset + filters.limit)
      : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-heading text-2xl font-medium">Offres d’emploi</h1>

      <form method="get" action="/jobs" className="mt-8">
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="q">Titre</FieldLabel>
            <Input id="q" name="q" defaultValue={filters.q} />
          </Field>
          <Field>
            <FieldLabel htmlFor="company">Entreprise</FieldLabel>
            <Input
              id="company"
              name="company"
              defaultValue={filters.company}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="location">Lieu</FieldLabel>
            <Input
              id="location"
              name="location"
              defaultValue={filters.location}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="publish_after">Publié après</FieldLabel>
            <Input
              id="publish_after"
              type="date"
              name="publish_after"
              defaultValue={filters.publishAfter}
            />
          </Field>
          <button
            type="submit"
            className={cn("sm:col-span-2", buttonVariants())}
          >
            Filtrer
          </button>
        </FieldGroup>
      </form>

      {isError ? (
        <p className="mt-8 text-destructive">
          {error ?? "Erreur de chargement."}{" "}
          <a href={retryHref} className={buttonVariants({ variant: "link" })}>
            Réessayer
          </a>
        </p>
      ) : null}

      {!isError && items.length === 0 ? (
        <Empty className="mt-8">
          <EmptyHeader>
            <EmptyTitle>Aucune offre</EmptyTitle>
            <EmptyDescription>
              Aucune offre pour ces filtres.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {!isError && items.length > 0 ? (
        <ul className="mt-8 grid gap-4">
          {items.map((job) => (
            <li key={job.id}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <a href={job.href} className="underline-offset-4 hover:underline">
                      {job.title ?? "Sans titre"}
                    </a>
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
                    isAuthenticated={isAuthenticated}
                    isSaved={savedIds.includes(job.id)}
                  />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}

      {!isError && (prevHref || nextHref) ? (
        <Pagination className="mt-8">
          <PaginationContent>
            {prevHref ? (
              <PaginationItem>
                <a
                  href={prevHref}
                  className={buttonVariants({ variant: "ghost" })}
                >
                  Précédent
                </a>
              </PaginationItem>
            ) : null}
            {nextHref ? (
              <PaginationItem>
                <a
                  href={nextHref}
                  className={buttonVariants({ variant: "ghost" })}
                >
                  Suivant
                </a>
              </PaginationItem>
            ) : null}
          </PaginationContent>
        </Pagination>
      ) : null}
    </main>
  );
}
