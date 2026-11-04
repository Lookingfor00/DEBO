"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { captureAttributionFromSearch } from "@/lib/analytics/attribution";
import { isSkipPath } from "@/lib/analytics/events";
import { bindFlushLifecycle, track } from "@/lib/analytics/track";
import { isAnalyticsAllowed } from "@/lib/consent/cookie-consent";

function AnalyticsProviderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => bindFlushLifecycle(), []);

  useEffect(() => {
    if (isSkipPath(pathname)) return;
    if (!isAnalyticsAllowed()) return;

    captureAttributionFromSearch(new URLSearchParams(searchParams.toString()));
    track("page_view");
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <AnalyticsProviderInner />
    </Suspense>
  );
}
