"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { isSkipPath } from "@/lib/analytics/events";
import { flushQueue, track } from "@/lib/analytics/track";
import {
  hasDecidedConsent,
  purgeAnalyticsIdentity,
  writeCookieConsent,
} from "@/lib/consent/cookie-consent";
import { cn } from "@/lib/utils";

export function CookieConsentBanner() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [decided, setDecided] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    setDecided(hasDecidedConsent());
    setReady(true);
  }, []);

  if (!ready || decided || isSkipPath(pathname)) return null;

  function acceptAll() {
    writeCookieConsent(true);
    track("consent_decision", { choice: "accepted" });
    void flushQueue();
    setDecided(true);
    setModalOpen(false);
  }

  function savePreferences() {
    writeCookieConsent(analyticsEnabled);
    track("consent_decision", {
      choice: analyticsEnabled ? "accepted" : "refused",
    });
    void flushQueue();
    setDecided(true);
    setModalOpen(false);
    if (!analyticsEnabled) {
      purgeAnalyticsIdentity();
      window.location.reload();
    }
  }

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background p-4 shadow-lg"
        role="region"
        aria-label="Cookies"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="font-heading text-base font-medium">Cookies</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nous utilisons des cookies essentiels au fonctionnement du site et
              des cookies analytiques pour améliorer l’expérience. Vous pouvez
              tout accepter ou personnaliser vos choix.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              className={buttonVariants({ variant: "outline" })}
              onClick={() => setModalOpen(true)}
            >
              Personnaliser
            </button>
            <button
              type="button"
              className={buttonVariants()}
              onClick={acceptAll}
            >
              Accepter tout
            </button>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-prefs-title"
            className="w-full max-w-md rounded-lg border border-border bg-background p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="cookie-prefs-title"
              className="font-heading text-lg font-medium"
            >
              Préférences cookies
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choisissez les catégories autorisées. Les cookies essentiels sont
              nécessaires au fonctionnement du site.
            </p>

            <ul className="mt-4 space-y-4">
              <li className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Essentiels</p>
                  <span className="text-xs text-muted-foreground">
                    Toujours actifs
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Requis pour la navigation et la sécurité.
                </p>
              </li>
              <li className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Analytique</p>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={analyticsEnabled}
                    aria-label="Analytique"
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      analyticsEnabled ? "bg-primary" : "bg-muted",
                    )}
                    onClick={() => setAnalyticsEnabled((value) => !value)}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 size-5 rounded-full bg-background transition-transform",
                        analyticsEnabled && "translate-x-5",
                      )}
                    />
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mesure d’audience et amélioration de l’expérience (Clarity).
                </p>
              </li>
            </ul>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className={buttonVariants({ variant: "outline" })}
                onClick={() => setModalOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className={buttonVariants()}
                onClick={savePreferences}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
