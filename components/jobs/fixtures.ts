import type { JobListFilters } from "@/lib/api/types";
import type { JobDetailVm } from "@/lib/mappers/map-job-detail";
import type { JobListItemVm } from "@/lib/mappers/map-job-list";

export const jobListItemFixture: JobListItemVm = {
  id: "abc",
  title: "Développeur",
  company: "Acme",
  location: "Paris",
  publishAt: "2026-01-01",
  href: "/jobs/abc",
};

export const jobListFiltersFixture: JobListFilters = {
  q: "",
  company: "",
  location: "",
  publishAfter: "",
  limit: 20,
  offset: 0,
};

export const jobDetailFixture: JobDetailVm = {
  id: "abc",
  title: "Développeur",
  company: "Acme",
  location: "Paris",
  publishAt: "2026-01-01",
  sourceUrl: "https://ex.com/1",
  descriptionMd: "## Mission\n\nBuild things.\n\n<script>alert(1)</script>",
};
