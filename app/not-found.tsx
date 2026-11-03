export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading text-2xl font-medium">Page introuvable</h1>
      <p className="mt-4 text-muted-foreground">
        Cette offre n’existe pas ou n’est plus publiée.
      </p>
      <p className="mt-4">
        <a href="/jobs" className="underline underline-offset-4">
          Retour à la liste
        </a>
      </p>
    </main>
  );
}
