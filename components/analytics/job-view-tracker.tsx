"use client";

import { useEffect } from "react";

import { track } from "@/lib/analytics/track";

type JobViewTrackerProps = {
  itemId: string;
  itemCode?: string | null;
};

export function JobViewTracker({ itemId, itemCode }: JobViewTrackerProps) {
  useEffect(() => {
    if (!itemId) return;
    track("job_view", {
      item_id: itemId,
      item_code: itemCode ?? undefined,
    });
  }, [itemId, itemCode]);

  return null;
}
