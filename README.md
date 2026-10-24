# TesFacture

SaaS de facturation pour les PME, artisans et freelances de Côte d'Ivoire (puis
d'Afrique de l'Ouest). Mobile-first, installable (PWA), en français, en FCFA.

> Créez une facture, un devis ou un bon de livraison en moins de deux minutes,
> depuis un téléphone, et envoyez-le sur WhatsApp.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack](#stack)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Base de données et migrations](#base-de-données-et-migrations)
- [Scripts](#scripts)
- [Règles de calcul](#règles-de-calcul)
- [Architecture](#architecture)
- [Déploiement (Neon + GitHub + Vercel)](#déploiement-neon--github--vercel)
- [Checklist de test](#checklist-de-test)
- [Reste à faire (version 2)](#reste-à-faire-version-2)

## Fonctionnalités

**Comptes**
- Inscription et connexion par **numéro de téléphone + mot de passe** (e-mail facultatif), mots de passe hachés avec bcrypt.
- Un numéro figurant dans `ADMIN_PHONES` obtient automatiquement le rôle `admin`.
- Profil d'entreprise : nom, logo (redimensionné à 240 px), RCCM, compte contribuable, adresse, téléphone, numéros Wave / Orange Money / MTN / Moov, note par défaut.

**Documents**
- Trois types : **facture (FAC)**, **devis (DEV)**, **bon de livraison (BL)** — le BL n'a ni prix, ni TVA, ni paiement.
- Parcours en 3 étapes (client → lignes → conditions) avec **aperçu en direct**.
- Autocomplétion du carnet de clients et création automatique du client s'il n'existe pas.
- Trois modèles de lignes en un clic, remise en %, TVA 0 ou 18 %, échéance, note, moyens de paiement.
- **Paiement en tranches** de 1 à 6, acompte personnalisable, montants modifiables avec contrôle que la somme égale le total.
- Calculs déterministes et statut automatique : `sent`, `partial`, `paid`, `overdue`.
- Montant en lettres : « Arrêté à la somme de : soixante mille francs CFA. »
- Numérotation `TYPE-ANNÉE-000N`, atomique par utilisateur / type / année.
- Actions : **PDF** (serveur, `@react-pdf/renderer`), **WhatsApp** (`wa.me`, préfixe 225 ajouté aux numéros à 10 chiffres), **e-mail** (`mailto:`), **lien public** `/d/[share_token]` en lecture seule, duplication, devis → facture, facture → bon de livraison, annulation, suppression.

**Tableau de bord utilisateur** (`/app`)
- Filtre de période : aujourd'hui, 7 jours, ce mois, mois dernier, cette année, personnalisé.
- Indicateurs : facturé, encaissé, à encaisser, en retard, devis en attente, taux de conversion, bons de livraison.
- Graphiques Recharts : facturé/encaissé sur 12 mois, anneau des encaissements par moyen de paiement, top 5 clients.
- Tables : à encaisser cette semaine, factures en retard (avec **relance WhatsApp** préremplie), derniers documents.
- Export CSV pour le comptable (plan Business).

**Administration** (`/admin`, rôle admin)
- Utilisateurs inscrits, nouveaux de la semaine, actifs sur 30 jours, répartition par plan, revenu mensuel récurrent, conversion gratuit → payant.
- Validation manuelle des demandes de paiement : active le plan 30 jours et génère la facture d'abonnement dans le compte de l'admin.
- Gestion des utilisateurs : recherche, changement de plan, suspension / réactivation, réinitialisation du mot de passe.
- Journal horodaté des actions administrateur.

**Abonnement sans API**
- Gratuit : 5 documents/mois, PDF avec mention « Créé avec TesFacture ».
- Pro 4 900 FCFA/mois, Business 9 900 FCFA/mois.
- Blocage **côté serveur** quand la limite est atteinte, avec page « Passez au plan Pro ».
- Paiement Wave : lien `WAVE_LINK_PRO` / `WAVE_LINK_BUSINESS`, puis saisie de la référence → demande en attente → validation par l'admin.
- Rappel 5 jours avant expiration, retour automatique au plan Gratuit (aucune donnée supprimée).

**PWA & sécurité**
- `manifest.webmanifest`, icônes 192/512, service worker avec cache de l'interface et page hors ligne.
- Bannière « Installer l'application », file d'attente des brouillons créés hors connexion (envoi automatique au retour du réseau).
- Rate limiting sur la connexion et l'inscription, en-têtes de sécurité, vérification de propriété sur chaque ressource, validation zod de toutes les entrées, limite de 2 Mo et contrôle de type avant redimensionnement du logo.

## Stack

| Élément | Choix |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions), TypeScript |
| Style | Tailwind CSS v4, police Bricolage Grotesque, coins 12 px, boutons ≥ 48 px, mode sombre automatique |
| Base de données | PostgreSQL (Neon) — **PGlite** en local si `DATABASE_URL` est vide |
| ORM | Drizzle ORM + migrations SQL versionnées |
| Authentification | Auth.js (NextAuth v5), Credentials, sessions JWT |
| Validation | zod |
| PDF | `@react-pdf/renderer` |
| Graphiques | Recharts |
| Tests | Vitest (calculs, tranches, montant en lettres, périodes, agrégats) |

## Démarrage rapide

```bash
git clone https://github.com/kouakoumark9-blip/tesfacture.git
cd tesfacture
npm install

cp .env.example .env.local        # puis ajustez AUTH_SECRET et ADMIN_PHONES
npm run db:migrate                # applique db/migrations
npm run db:seed                   # crée le compte administrateur
npm run db:demo                   # (facultatif) jeu de démonstration

npm run dev                       # http://localhost:3000
```

Connexion de démonstration : **`07 00 00 00 00`** / **`Admin1234!`**

Sans `DATABASE_URL`, l'application utilise **PGlite** (PostgreSQL compilé en WASM)
dans `.data/pg` : aucun serveur Postgres à installer pour développer. Attention :
un seul processus à la fois sur le même dossier — arrêtez `npm run dev` avant de
lancer un script (`db:seed`, `db:demo`).

## Variables d'environnement

| Variable | Obligatoire | Rôle |
|---|---|---|
| `DATABASE_URL` | production | Chaîne de connexion Neon (`postgresql://…?sslmode=require`). Vide ⇒ PGlite local |
| `AUTH_SECRET` | oui | Secret de signature des sessions (`openssl rand -base64 32`) |
| `ADMIN_PHONES` | oui | Numéros admin séparés par des virgules ; ils reçoivent le rôle `admin` |
| `WAVE_LINK_PRO` | recommandé | Lien de paiement Wave pour le plan Pro |
| `WAVE_LINK_BUSINESS` | recommandé | Lien de paiement Wave pour le plan Business |
| `APP_URL` | oui | URL publique, utilisée dans les liens de partage `/d/…` |
| `PGLITE_DIR` | non | Dossier PGlite local (défaut `.data/pg`) |
| `ADMIN_PASSWORD` / `ADMIN_NAME` | non | Utilisés par `npm run db:seed` |
| `RESEND_API_KEY` / `RESEND_FROM` | non | Prévus pour l'envoi d'e-mail automatique en version 2 |

## Base de données et migrations

- Schéma : `db/schema.ts` (Drizzle).
- Migrations SQL : `db/migrations/*.sql`, appliquées **automatiquement** au premier accès à la base (`db/client.ts`), avec la table `_migrations` pour ne jamais rejouer un fichier.
- Pour modifier le schéma : éditez `db/schema.ts`, ajoutez `db/migrations/000N_xxx.sql`, redémarrez.

Tables : `users`, `companies`, `clients`, `documents`, `document_items`, `installments`, `payment_requests`, `counters`, `admin_actions`.

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` / `npm start` | build et serveur de production |
| `npm run typecheck` | vérification TypeScript |
| `npm test` | tests Vitest : 68 tests (calculs, montants en lettres, statistiques, intégration documents + abonnement sur base PGlite isolée) |
| `npm run db:migrate` | applique les migrations |
| `npm run db:seed` | crée / met à jour le compte admin |
| `npm run db:demo` | jeu de démonstration (4 clients, 6 documents) |

## Règles de calcul

```
sous-total = Σ (quantité × prix unitaire)
remise     = arrondi(sous-total × remise %)
TVA        = arrondi((sous-total − remise) × TVA %)
total      = sous-total − remise + TVA
```

**Tranches** — nombre de 1 à 6. À 1 : « Paiement comptant », aucun champ acompte.
Sinon : premier versement saisi, le reste réparti à parts égales **arrondies à
100 FCFA vers le bas**, la dernière tranche absorbant la différence.

```
total 60 000, acompte 20 000, 4 tranches → 20 000 / 13 300 / 13 300 / 13 400
```

**Statut automatique** : payé si toutes les tranches sont réglées ; en retard si
une échéance est dépassée et non payée ; partiel si au moins une tranche est
réglée ; sinon envoyé / brouillon / livré.

**Définitions du tableau de bord** : facturé = factures non annulées émises sur
la période ; encaissé = tranches dont la date de paiement tombe dans la période ;
à encaisser = total des factures non annulées − tranches payées ; en retard =
tranches non payées dont l'échéance est passée. **Devis et bons de livraison ne
comptent jamais dans le chiffre d'affaires.**

## Architecture

```
app/
  (auth)/connexion, inscription      comptes
  page.tsx                           accueil public (redirige vers /app si connecté)
  app/                               espace utilisateur (protégé)
    page.tsx                         tableau de bord + filtres de période
    documents/                       liste, création (3 étapes), détail, édition
    factures|devis|livraisons/       listes filtrées par type
    clients/                         carnet de clients
    profil-entreprise/               identité + Mobile Money + logo
    abonnement/                      plans, paiement Wave, historique
    limite/                          page « Passez au plan Pro »
  admin/                             administration (rôle admin)
  d/[token]/                         document public en lecture seule
  api/auth, api/documents/[id]/pdf, api/export
  offline/, suspendu/                pages système
components/                          UI, assistant de document, aperçu, PDF, graphiques
db/                                  schéma Drizzle, client (Neon/PGlite), migrations
lib/
  actions/                           server actions (auth, entreprise, documents)
  calc.ts money.ts stats.ts period.ts règles de calcul testées
  documents.ts dashboard.ts admin.ts plan.ts subscription.ts
  share.ts email.ts offline-queue.ts validation.ts
scripts/                             migrate, seed, demo
```

## Déploiement (Neon + GitHub + Vercel)

1. **Neon** — créez un projet sur [neon.tech](https://neon.tech), copiez la chaîne de connexion (`postgresql://…?sslmode=require`) → `DATABASE_URL`.
2. **GitHub** — poussez le dépôt : `git push origin main`.
3. **Vercel** — *Add New Project* → importez le dépôt → framework détecté : Next.js.
4. **Variables** — renseignez `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_PHONES`, `APP_URL`, `WAVE_LINK_PRO`, `WAVE_LINK_BUSINESS`.
5. **Migrations** — elles s'appliquent au premier chargement ; pour forcer :
   `DATABASE_URL=… npx tsx scripts/migrate.ts`.
6. **Admin** — `DATABASE_URL=… ADMIN_PHONES=… ADMIN_PASSWORD=… npx tsx scripts/seed.ts`, puis connexion sur `/connexion`.
7. **Test en production** — créez une facture, téléchargez le PDF, ouvrez le lien `/d/[token]` en navigation privée, validez une demande de paiement depuis `/admin`.

## Checklist de test

- [x] Créer un compte, renseigner l'entreprise, ajouter un logo (redimensionné).
- [x] Facture de 60 000 FCFA, acompte 20 000, 4 tranches → `20 000 / 13 300 / 13 300 / 13 400` (test unitaire `lib/calc.test.ts`).
- [x] Remise 10 % + TVA 18 % → total et montant en lettres (`lib/money.test.ts`).
- [x] Choisir Wave et Espèces → affichage sur le PDF et dans le message WhatsApp.
- [x] 1 tranche → le champ acompte disparaît.
- [x] Marquer une tranche payée → statut « partiel », puis « payé » après la dernière.
- [x] Bon de livraison depuis une facture → sans prix, deux zones de signature.
- [x] Lien public `/d/[token]` accessible sans connexion ; PDF via `?token=`.
- [x] 6e document en plan Gratuit bloqué côté serveur (page `/app/limite`).
- [x] Demande de paiement validée depuis `/admin` → plan + facture d'abonnement.
- [x] Accès aux documents d'un autre utilisateur → 404.
- [ ] Installation sur téléphone et mode hors ligne (à rejouer sur un vrai appareil).

## Reste à faire (version 2)

- **Envoi d'e-mail automatique avec PDF joint** : brancher Resend (`RESEND_API_KEY`) dans `lib/email.ts` ; la couche est déjà isolée et le corps du message prêt.
- **Paiement automatique** : API Wave / Orange Money pour valider sans intervention admin (webhook + `payment_requests.status`).
- **Relances programmées** : cron (Vercel Cron) sur les tranches échues avec envoi WhatsApp Business / SMS.
- Multi-utilisateurs réel par entreprise (plan Business : 3 sièges), rôles fins.
- Réinitialisation de mot de passe en autonomie (code OTP par SMS).
- Réconciliation : lettrage des paiements partiels par virement.
