import type { PublicJobDto } from "@/lib/api/types";

export type JobDetailVm = {
  id: string;
  title: string | null;
  company: string | null;
  location: string | null;
  publishAt: string | null;
  sourceUrl: string | null;
  descriptionMd: string | null;
};

export function mapJobDetail(dto: PublicJobDto): JobDetailVm {
  return {
    id: dto.id,
    title: dto.title,
    company: dto.company,
    location: dto.location,
    publishAt: dto.publish_at,
    sourceUrl: dto.source_url,
    descriptionMd: dto.description_md,
  };
}
