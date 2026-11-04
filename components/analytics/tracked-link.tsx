"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent, ReactNode } from "react";

import { track } from "@/lib/analytics/track";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  ctaId: string;
  location: string;
  eventName?: "cta_click" | "job_click" | "nav_click";
  itemId?: string;
  itemCode?: string;
};

export function TrackedLink({
  ctaId,
  location,
  eventName = "cta_click",
  itemId,
  itemCode,
  onClick,
  href,
  children,
  ...rest
}: TrackedLinkProps) {
  return (
    <Link
      {...rest}
      href={href}
      onClick={(event) => {
        track(eventName, {
          cta_id: ctaId,
          location,
          target: typeof href === "string" ? href : String(href),
          item_id: itemId,
          item_code: itemCode,
        });
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}

type TrackedAnchorProps = ComponentProps<"a"> & {
  ctaId: string;
  location: string;
  outbound?: boolean;
  eventName?: "cta_click" | "job_click" | "nav_click";
  itemId?: string;
  itemCode?: string;
  children: ReactNode;
};

export function trackOutbound(href: string, location: string): void {
  let kind = "external";
  let domain: string | null = null;
  try {
    const url = new URL(href, window.location.origin);
    const host = url.hostname.toLowerCase();
    domain = host;
    if (url.protocol === "mailto:") kind = "mailto";
    else if (url.protocol === "tel:") kind = "tel";
    else if (host.includes("whatsapp") || host === "wa.me") kind = "whatsapp";
    else if (host.includes("facebook") || host === "fb.com") kind = "facebook";
    else if (host.includes("linkedin")) kind = "linkedin";
    else if (host.includes("t.me") || host.includes("telegram")) kind = "telegram";
  } catch {
    // ignore
  }

  track("outbound_click", {
    location,
    kind,
    domain,
  });
}

export function TrackedAnchor({
  ctaId,
  location,
  outbound = false,
  eventName = "cta_click",
  itemId,
  itemCode,
  href,
  onClick,
  children,
  ...rest
}: TrackedAnchorProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const target = href ?? "";
    if (outbound || isExternalHref(target)) {
      trackOutbound(target, location);
    } else {
      track(eventName, {
        cta_id: ctaId,
        location,
        target,
        item_id: itemId,
        item_code: itemCode,
      });
    }
    onClick?.(event);
  }

  return (
    <a {...rest} href={href} onClick={handleClick}>
      {children}
    </a>
  );
}

function isExternalHref(href: string): boolean {
  if (!href) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return true;
  if (href.startsWith("http://") || href.startsWith("https://")) {
    try {
      return new URL(href).origin !== window.location.origin;
    } catch {
      return true;
    }
  }
  return false;
}
