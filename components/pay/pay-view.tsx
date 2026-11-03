import {
  BadgeCheck,
  ListOrdered,
  Smartphone,
  TriangleAlert,
  Wallet,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type {
  PayMerchantVm,
  PayPlanVm,
  PaySubscriptionVm,
} from "@/lib/mappers/map-pay-page";

export type PayViewProps = {
  isAuthenticated: boolean;
  payerMsisdn: string | null;
  balanceXof: number | null;
  merchants: PayMerchantVm[];
  plans: PayPlanVm[];
  activeSubscription: PaySubscriptionVm | null;
  supportMsisdn: string | null;
  isError: boolean;
  error: string | null;
  conflict?: boolean;
  purchased?: boolean;
  purchaseError?: "insufficient" | "missing" | null;
  invoiceRef?: string | null;
  invoiceRefRequired?: boolean;
  credited?: boolean;
  invoiceError?: string | null;
  activationCode?: string | null;
  activationCodeAlreadyIssued?: boolean;
};

function formatEndsAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PayView({
  isAuthenticated,
  payerMsisdn,
  balanceXof,
  merchants,
  plans,
  activeSubscription,
  supportMsisdn,
  isError,
  error,
  conflict = false,
  purchased = false,
  purchaseError = null,
  invoiceRef = null,
  invoiceRefRequired = false,
  credited = false,
  invoiceError = null,
  activationCode = null,
  activationCodeAlreadyIssued = false,
}: PayViewProps) {
  const balance = balanceXof ?? 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-heading text-2xl font-medium">Payer</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Créditez votre solde via Orange Money ou Moov, puis activez le premium.
      </p>

      <section className="mt-8" aria-labelledby="pay-methods-heading">
        <h2
          id="pay-methods-heading"
          className="font-heading flex items-center gap-2 text-xl font-medium"
        >
          <Wallet className="size-5 shrink-0" aria-hidden />
          Méthodes de paiement
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nous acceptons les envois vers nos numéros marchands :
        </p>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
          {merchants.length === 0 ? (
            <li className="text-muted-foreground">Aucune méthode active.</li>
          ) : (
            merchants.map((merchant) => (
              <li
                key={merchant.displayName}
                className="rounded-md border border-border px-3 py-1.5"
              >
                {merchant.displayName}
              </li>
            ))
          )}
        </ul>
      </section>

      {isError ? (
        <p className="mt-8 text-destructive">{error ?? "Erreur de chargement."}</p>
      ) : null}

      {conflict ? (
        <p className="mt-6 text-destructive">
          Ce numéro est déjà utilisé par un autre compte.
        </p>
      ) : null}

      {purchased ? (
        <section
          className="mt-6 max-w-xl rounded-md border border-border p-4"
          aria-labelledby="pay-activation-code-heading"
        >
          <h2
            id="pay-activation-code-heading"
            className="font-heading text-base font-medium"
          >
            Achat enregistré
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre abonnement premium est actif.
          </p>
          {activationCode ? (
            <>
              <p className="mt-4 text-sm font-medium text-foreground">
                Conservez ce code d’activation maintenant — il ne sera plus
                affiché.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Notez-le ou copiez-le. Il servira à activer les alertes sur votre
                téléphone.
              </p>
              <Field className="mt-4">
                <FieldLabel htmlFor="activation_code_display">
                  Code d’activation
                </FieldLabel>
                <Input
                  id="activation_code_display"
                  readOnly
                  value={activationCode}
                  aria-label="Code d’activation à conserver"
                />
              </Field>
            </>
          ) : null}
          {activationCodeAlreadyIssued ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Un code d’activation a déjà été émis pour ce compte. Pour des
              raisons de sécurité, il ne peut pas être réaffiché. Utilisez le
              code que vous avez sauvegardé, ou contactez le support si vous
              l’avez perdu.
            </p>
          ) : null}
          {!activationCode && !activationCodeAlreadyIssued ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Le code d’activation n’a pas pu être généré pour le moment.
              Réessayez depuis cette page après actualisation, ou contactez le
              support.
            </p>
          ) : null}
        </section>
      ) : null}

      {purchaseError === "insufficient" ? (
        <p className="mt-6 text-destructive">
          Solde insuffisant pour ce plan.
        </p>
      ) : null}

      {purchaseError === "missing" ? (
        <p className="mt-6 text-destructive">Plan introuvable.</p>
      ) : null}

      {credited ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Paiement confirmé. Votre solde a été mis à jour.
        </p>
      ) : null}

      {invoiceError === "reference_not_found" ? (
        <p className="mt-6 text-destructive">
          Référence introuvable ou déjà créditée. Vérifiez le SMS.
        </p>
      ) : null}

      {invoiceError === "reference_required" ? (
        <p className="mt-6 text-destructive">
          Saisissez la référence figurant sur le SMS.
        </p>
      ) : null}

      {invoiceError === "wallet_not_found" ? (
        <p className="mt-6 text-destructive">
          Enregistrez d’abord votre numéro payeur.
        </p>
      ) : null}

      {invoiceRefRequired && !invoiceError ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Indiquez la dernière référence SMS confirmée pour afficher le solde.
        </p>
      ) : null}

      {!isAuthenticated ? (
        <section className="mt-10" aria-labelledby="pay-login-heading">
          <h2
            id="pay-login-heading"
            className="font-heading text-xl font-medium"
          >
            Connexion requise
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Inscrivez-vous ou connectez-vous pour déclarer votre numéro payeur et
            bénéficier du service premium.
          </p>
          <p className="mt-4">
            <a href="/auth/login" className={buttonVariants()}>
              Connexion
            </a>
          </p>
        </section>
      ) : (
        <>
          <section className="mt-10" aria-labelledby="pay-step1-heading">
            <h2
              id="pay-step1-heading"
              className="font-heading flex items-center gap-2 text-xl font-medium"
            >
              <Smartphone className="size-5 shrink-0" aria-hidden />
              Étape 1 — Renseignez votre numéro payeur
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Indiquez le numéro Mobile Money avec lequel vous allez envoyer
              l’argent. C’est ce numéro qui doit apparaître comme expéditeur du
              SMS marchand.
            </p>
            <form method="post" action="/api/wallet" className="mt-6">
              <FieldGroup className="max-w-md gap-4">
                <Field>
                  <FieldLabel htmlFor="payer_msisdn">Numéro payeur</FieldLabel>
                  <Input
                    id="payer_msisdn"
                    name="payer_msisdn"
                    defaultValue={payerMsisdn ?? ""}
                    autoComplete="tel"
                  />
                </Field>
                <button type="submit" className={buttonVariants()}>
                  Enregistrer
                </button>
              </FieldGroup>
            </form>
          </section>

          <section className="mt-12" aria-labelledby="pay-step2-heading">
            <h2
              id="pay-step2-heading"
              className="font-heading flex items-center gap-2 text-xl font-medium"
            >
              <ListOrdered className="size-5 shrink-0" aria-hidden />
              Étape 2 — Payer avec le numéro{" "}
              {payerMsisdn ?? "(à renseigner)"}
            </h2>
            <p className="mt-2 text-sm">
              Solde : {balanceXof === null ? "—" : `${balanceXof} XOF`}
            </p>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Envoyez n’importe quel montant vers l’un des numéros marchands
              ci-dessous. Le crédit n’apparaît qu’après confirmation de la
              référence SMS à l’étape suivante.
            </p>
            <ul className="mt-6 grid gap-4">
              {merchants.map((merchant) => (
                <li key={merchant.displayName}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{merchant.displayName}</CardTitle>
                      <CardDescription>
                        {merchant.msisdn
                          ? "Copiez ce numéro pour envoyer le paiement."
                          : "Numéro marchand non renseigné."}
                      </CardDescription>
                    </CardHeader>
                    {merchant.msisdn ? (
                      <CardContent>
                        <Input
                          readOnly
                          value={merchant.msisdn}
                          aria-label={`Numéro ${merchant.displayName}`}
                        />
                      </CardContent>
                    ) : null}
                  </Card>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12" aria-labelledby="pay-invoice-heading">
            <h2
              id="pay-invoice-heading"
              className="font-heading flex items-center gap-2 text-xl font-medium"
            >
              <BadgeCheck className="size-5 shrink-0" aria-hidden />
              Étape 3 — Confirmer la référence SMS
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Saisissez le numéro de facture / référence du SMS marchand pour
              créditer votre solde (et pour le consulter ensuite).
            </p>
            <form
              method="post"
              action="/api/wallet/confirm-invoice"
              className="mt-6"
            >
              <FieldGroup className="max-w-md gap-4">
                <Field>
                  <FieldLabel htmlFor="invoice_ref">Référence SMS</FieldLabel>
                  <Input
                    id="invoice_ref"
                    name="reference"
                    defaultValue={invoiceRef ?? ""}
                    autoComplete="off"
                  />
                </Field>
                <button type="submit" className={buttonVariants()}>
                  Confirmer le crédit
                </button>
              </FieldGroup>
            </form>
          </section>

          <section className="mt-12" aria-labelledby="pay-step3-heading">
            <h2
              id="pay-step3-heading"
              className="font-heading flex items-center gap-2 text-xl font-medium"
            >
              <BadgeCheck className="size-5 shrink-0" aria-hidden />
              Étape 4 — Choisir un plan premium
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Lorsque votre solde atteint la somme nécessaire au premium, vous
              pouvez alors choisir l’un des plans suivants.
            </p>

            {activeSubscription ? (
              <p className="mt-6 text-sm">
                Premium actif jusqu’au{" "}
                {formatEndsAt(activeSubscription.endsAt)}.
              </p>
            ) : (
              <ul className="mt-6 grid gap-4">
                {plans.map((plan) => {
                  const canBuy = balance >= plan.priceXof;
                  const missing = Math.max(0, plan.priceXof - balance);
                  return (
                    <li key={plan.id}>
                      <Card>
                        <CardHeader>
                          <CardTitle>{plan.displayName}</CardTitle>
                          <CardDescription>
                            {plan.priceXof} XOF / {plan.durationDays} jours
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {canBuy ? (
                            <form
                              method="post"
                              action="/api/plans/purchase"
                            >
                              <input
                                type="hidden"
                                name="plan_id"
                                value={plan.id}
                              />
                              <button
                                type="submit"
                                className={buttonVariants()}
                              >
                                Acheter
                              </button>
                            </form>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Créditez encore {missing} XOF pour activer ce
                              plan.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      <aside
        className="mt-14 max-w-xl rounded-md border border-border p-4 text-sm text-muted-foreground"
        aria-labelledby="pay-refund-heading"
      >
        <h2
          id="pay-refund-heading"
          className="font-heading flex items-center gap-2 text-base font-medium text-foreground"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden />
          Remboursements
        </h2>
        <p className="mt-2">
          Les remboursements ne peuvent être faits que du lundi au vendredi
          entre 14 h et 17 h. En cas d’erreur de paiement ou de tout autre
          problème, n’hésitez pas à nous contacter
          {supportMsisdn ? (
            <>
              {" "}
              au numéro suivant :{" "}
              <span className="text-foreground">{supportMsisdn}</span>
            </>
          ) : (
            "."
          )}
          {supportMsisdn ? "." : null}
        </p>
      </aside>
    </main>
  );
}
