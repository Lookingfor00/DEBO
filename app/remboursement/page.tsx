import { buttonVariants } from "@/components/ui/button";

export default function RefundRequestPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading text-2xl font-medium">
        Demande de remboursement
      </h1>
      <p className="mt-4 text-muted-foreground">
        Le formulaire de demande de remboursement arrive bientôt. Indiquez
        votre numéro de téléphone payeur pour démarrer la garantie des 30
        jours.
      </p>
      <p className="mt-8">
        <a href="/" className={buttonVariants({ variant: "secondary" })}>
          Retour à l’accueil
        </a>
      </p>
    </main>
  );
}
