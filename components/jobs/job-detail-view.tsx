import Markdown from "react-markdown";

import { FavoriteToggleView } from "@/components/jobs/favorite-toggle-view";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { JobDetailVm } from "@/lib/mappers/map-job-detail";

export type JobDetailViewProps = {
  job: JobDetailVm;
  isAuthenticated?: boolean;
  isSaved?: boolean;
};

export function JobDetailView({
  job,
  isAuthenticated = false,
  isSaved = false,
}: JobDetailViewProps) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p>
        <a href="/jobs" className={buttonVariants({ variant: "link" })}>
          Retour à la liste
        </a>
      </p>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">
            {job.title ?? "Sans titre"}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            {job.company ? (
              <Badge variant="secondary">{job.company}</Badge>
            ) : null}
            {job.location ? (
              <Badge variant="outline">{job.location}</Badge>
            ) : null}
            {job.publishAt ? (
              <Badge variant="outline">{job.publishAt}</Badge>
            ) : null}
          </div>
          <FavoriteToggleView
            itemId={job.id}
            isAuthenticated={isAuthenticated}
            isSaved={isSaved}
          />
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {job.sourceUrl ? (
            <p className="mb-6 text-sm">
              <a href={job.sourceUrl} className="underline underline-offset-4">
                Offre d’origine
              </a>
            </p>
          ) : null}
          {job.descriptionMd ? (
            <article className="prose max-w-none text-foreground">
              <Markdown>{job.descriptionMd}</Markdown>
            </article>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
