"use client";

import { useEffect } from "react";

export const LAST_INVOICE_REF_KEY = "jobboard:last_invoice_ref";

type InvoiceRefSyncProps = {
  invoiceRef: string | null;
};

/**
 * Persists confirmed invoice ref and restores it into the URL for SSR GET gate.
 */
export function InvoiceRefSync({ invoiceRef }: InvoiceRefSyncProps) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (invoiceRef) {
      window.localStorage.setItem(LAST_INVOICE_REF_KEY, invoiceRef);
      return;
    }
    const stored = window.localStorage.getItem(LAST_INVOICE_REF_KEY)?.trim();
    if (!stored) {
      return;
    }
    const url = new URL(window.location.href);
    if (url.searchParams.get("invoice_ref")) {
      return;
    }
    url.searchParams.set("invoice_ref", stored);
    window.location.replace(url.toString());
  }, [invoiceRef]);

  return null;
}
