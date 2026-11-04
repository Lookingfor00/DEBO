# Tiny Bear — context (alertes / codes / pay)

**SoT décisions wave 6** = bloc ci-dessous (mini-freeze 2026-11-03).  
Canon: [`../../../../SOLINET-SHARED-SUPABASE.md`](../../../../SOLINET-SHARED-SUPABASE.md).  
Mirror notes: [`../../../../docs/tickets/00-sprint-tiny-bear/context.md`](../../../../docs/tickets/00-sprint-tiny-bear/context.md).

## Décisions figées — alertes browser + codes + garde-fou pay (2026-11-03)

| # | Décision | Choix |
|---|----------|-------|
| 1 | Client | Browser sur DEBO job board (pas d’app native V1) |
| 2 | WhatsApp / Web Push | WhatsApp hors V1. **Web Push browser MVP = wave 7 (TB-023)** pour tester les filtres alertes |
| 3 | Surface UI | Page `/alerts` = liste des alertes / offres matchées |
| 4 | Identité alertes | Téléphone + code d’activation (pas Auth0 sur cette surface) |
| 5 | Session alertes | Cookie serveur httpOnly après activation |
| 6 | Filtres V1 | Mots-clés seuls (expérience/domaine = mots-clés) |
| 7 | Création du code | Serveur uniquement ; front demande seulement |
| 8 | Invalidation code | App paiement : saisir un code + bouton invalider ; pas de liste |
| 9 | Schema / instance | Même Supabase `ai-scrapper` ; V1 tables dans `jobboard` ; pas de 3ᵉ instance |
| 10 | Garde-fou recharge | N° facture = référence SMS ; retapé ; localStorage pour GET solde |
| 11 | Solde | Backend fait foi ; front GET only ; mismatch → backend |
| 12 | Scope garde-fou facture | Recharges wallet Auth0 seulement — pas achat abonnement / émission code |
| 13 | Tickets APK | Dossier pay-sms ; même INDEX d’ordre (Tiny Bear wave 6) |

Hors scope V1: native, WhatsApp, OTP SMS, extraction pay multi-repo, nouvel `app_id`.  
Wave 7 in scope: Web Push browser MVP (TB-023); tri catalogue `publish_at` desc (TB-022).

Prêt pour tickets: oui — wave 6 done; wave 7 = TB-022 → TB-023.
