"use client";

import type { FormEvent, ReactNode } from "react";

import { track } from "@/lib/analytics/track";

type JobListFilterTrackerProps = {
  children: ReactNode;
  className?: string;
};

export function JobListFilterTracker({
  children,
  className,
}: JobListFilterTrackerProps) {
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const data = new FormData(form);
    const q = String(data.get("q") ?? "").trim().slice(0, 100);
    const company = String(data.get("company") ?? "").trim().slice(0, 100);
    const location = String(data.get("location") ?? "").trim().slice(0, 100);
    const publishAfter = String(data.get("publish_after") ?? "").trim();

    track("list_filter", {
      has_q: q.length > 0,
      has_company: company.length > 0,
      has_location: location.length > 0,
      has_publish_after: publishAfter.length > 0,
      company: company || undefined,
      location: location || undefined,
      publish_after: publishAfter || undefined,
    });

    if (q.length >= 2) {
      track("list_search", {
        q_len: q.length,
        q: q.slice(0, 100),
      });
    }
  }

  return (
    <form method="get" action="/jobs" className={className} onSubmit={onSubmit}>
      {children}
    </form>
  );
}
