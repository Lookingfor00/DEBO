import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Heebo, Jost } from "next/font/google";

import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { CookieConsentBanner } from "@/components/analytics/cookie-consent-banner";
import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity";
import { SiteFooterView } from "@/components/layout/site-footer-view";
import { SiteHeaderView } from "@/components/layout/site-header-view";
import { getVisitorSession } from "@/lib/auth0";
import { cn } from "@/lib/utils";

import "./globals.css";

const heebo = Heebo({ subsets: ["latin"], variable: "--font-heebo" });
const jost = Jost({ subsets: ["latin"], variable: "--font-jost" });

export const metadata: Metadata = {
  title: "Debo — offres d’emploi",
  description: "Job board Solinet",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getVisitorSession();
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn("font-sans", heebo.variable, jost.variable)}
    >
      <body
        className="flex min-h-svh flex-col bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        <MicrosoftClarity />
        <AnalyticsProvider />
        <CookieConsentBanner />
        <SiteHeaderView
          isAuthenticated={session.isAuthenticated}
          displayName={session.displayName}
        />
        <div className="flex-1">{children}</div>
        <SiteFooterView />
      </body>
    </html>
  );
}
