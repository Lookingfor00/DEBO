"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Clarity from "@microsoft/clarity";

import { clarityIdentify } from "@/lib/analytics/clarity";
import { isSkipPath } from "@/lib/analytics/events";
import { getAnonId } from "@/lib/analytics/identity";
import { applyClaritySessionTags } from "@/lib/analytics/track";
import { isAnalyticsAllowed } from "@/lib/consent/cookie-consent";

export function MicrosoftClarity() {
  const pathname = usePathname();
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const initialized = useRef(false);

  useEffect(() => {
    if (!projectId || initialized.current) return;
    if (isSkipPath(pathname)) return;
    if (!isAnalyticsAllowed()) return;

    Clarity.init(projectId);
    initialized.current = true;
    try {
      clarityIdentify(getAnonId());
      applyClaritySessionTags();
    } catch {
      // ignore
    }
  }, [pathname, projectId]);

  return null;
}
