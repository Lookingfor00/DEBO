import { MenuIcon } from "lucide-react";

import { TrackedAnchor } from "@/components/analytics/tracked-link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type SiteHeaderViewProps = {
  isAuthenticated: boolean;
  displayName: string | null;
};

function NavLinks({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <>
      <TrackedAnchor
        href="/"
        ctaId="nav_home"
        location="header"
        eventName="nav_click"
        className="text-sm font-medium text-primary-foreground"
      >
        Accueil
      </TrackedAnchor>
      <TrackedAnchor
        href="/jobs"
        ctaId="nav_jobs"
        location="header"
        eventName="nav_click"
        className="text-sm font-medium text-primary-foreground"
      >
        Offres
      </TrackedAnchor>
      {isAuthenticated ? (
        <TrackedAnchor
          href="/favorites"
          ctaId="nav_favorites"
          location="header"
          eventName="nav_click"
          className="text-sm font-medium text-primary-foreground"
        >
          Favoris
        </TrackedAnchor>
      ) : null}
      <TrackedAnchor
        href="/alerts"
        ctaId="nav_alerts"
        location="header"
        eventName="nav_click"
        className="text-sm font-medium text-primary-foreground"
      >
        Alertes
      </TrackedAnchor>
      <TrackedAnchor
        href="/pay"
        ctaId="nav_pay"
        location="header"
        eventName="nav_click"
        className="text-sm font-medium text-primary-foreground"
      >
        Payer
      </TrackedAnchor>
    </>
  );
}

function AuthControl({
  isAuthenticated,
  displayName,
}: SiteHeaderViewProps) {
  if (isAuthenticated) {
    return (
      <p className="flex items-center gap-3 text-sm text-primary-foreground">
        <span>{displayName}</span>
        <a
          href="/auth/logout"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Déconnexion
        </a>
      </p>
    );
  }
  return (
    <a
      href="/auth/login"
      className={buttonVariants({ variant: "secondary", size: "sm" })}
    >
      Connexion
    </a>
  );
}

export function SiteHeaderView({
  isAuthenticated,
  displayName,
}: SiteHeaderViewProps) {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2">
        <TrackedAnchor
          href="/"
          ctaId="nav_logo"
          location="header"
          eventName="nav_click"
          className="flex items-center gap-2"
        >
          <img src="/logowhite.png" alt="" className="size-10" />
          <span className="font-heading text-xl font-medium">Debo</span>
        </TrackedAnchor>
        <nav className="hidden items-center gap-6 md:flex">
          <NavLinks isAuthenticated={isAuthenticated} />
          <AuthControl
            isAuthenticated={isAuthenticated}
            displayName={displayName}
          />
        </nav>
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="secondary"
                size="icon"
                className="md:hidden"
                aria-label="Menu"
              />
            }
          >
            <MenuIcon />
          </SheetTrigger>
          <SheetContent side="right" className="bg-primary text-primary-foreground">
            <SheetHeader>
              <SheetTitle className="text-primary-foreground">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 px-4">
              <NavLinks isAuthenticated={isAuthenticated} />
              <AuthControl
                isAuthenticated={isAuthenticated}
                displayName={displayName}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
