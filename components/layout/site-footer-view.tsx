export function SiteFooterView() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
        <p>Debo — offres d’emploi</p>
        <p>
          <a href="/jobs" className="underline-offset-4 hover:underline">
            Voir les offres
          </a>
        </p>
      </div>
    </footer>
  );
}
