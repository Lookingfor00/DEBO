import { MenuIcon } from "lucide-react";

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

function NavLinks() {
  return (
    <>
      <a href="/" className="text-sm font-medium text-primary-foreground">
        Accueil
      </a>
      <a href="/jobs" className="text-sm font-medium text-primary-foreground">
        Offres
      </a>
      <a href="/alerts" className="text-sm font-medium text-primary-foreground">
        Alertes
      </a>
      <a href="/pay" className="text-sm font-medium text-primary-foreground">
        Payer
      </a>
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
        <a href="/" className="flex items-center gap-2">
          <img src="/logowhite.png" alt="" className="size-10" />
          <span className="font-heading text-xl font-medium">Debo</span>
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          <NavLinks />
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
              <NavLinks />
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
