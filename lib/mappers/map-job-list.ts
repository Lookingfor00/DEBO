import type { PublicJobDto } from "@/lib/api/types";

export type JobListItemVm = {
  id: string;
  title: string | null;
  company: string | null;
  location: string | null;
  publishAt: string | null;
  href: string;
};

export function mapJobListItem(dto: PublicJobDto): JobListItemVm {
  return {
    id: dto.id,
    title: dto.title,
    company: dto.company,
    location: dto.location,
    publishAt: dto.publish_at,
    href: `/jobs/${dto.id}`,
  };
}

export function mapJobList(items: PublicJobDto[]): JobListItemVm[] {
  return items.map(mapJobListItem);
}
