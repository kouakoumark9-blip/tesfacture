# tesfacture

Application de facturation pour les entreprises ivoiriennes et ouest-africaines :
factures et devis en FCFA, TVA configurable, suivi des encaissements, export PDF
et tableau de bord.

> Démo : l'application démarre avec un jeu de données réaliste (5 clients,
> 20 documents sur les 6 derniers mois). Tout se réinitialise depuis
> **Paramètres → Réinitialiser les données de démo**.

## Fonctionnalités

- **Tableau de bord** — CA encaissé, en attente, impayés en retard, devis ouverts,
  graphique 6 mois, meilleurs clients, relances à faire.
- **Clients** — fiche complète (entreprise, contact, NCC, coordonnées, notes),
  historique des documents, synthèse financière par client.
- **Devis** — création, validité, statuts (brouillon → envoyé → accepté/refusé),
  conversion en facture en un clic.
- **Factures** — numérotation automatique (`FAC-AAAA-0001`), échéances, statuts,
  encaissement, relances, duplication.
- **Documents** — mise en page professionnelle imprimable et export **PDF** réel
  (pdf-lib, A4, en-tête, totaux, mentions légales, coordonnées bancaires).
- **Paramètres** — identité de l'entreprise, devise, TVA par défaut, préfixes,
  délais de paiement, conditions de règlement, pied de page.
- **UI** — responsive, français, montants formatés `1 250 000 FCFA`, filtres et
  recherche instantanée.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) + **TypeScript**
- **Tailwind CSS v4**
- **pdf-lib** pour la génération des PDF
- **lucide-react** pour les icônes
- Persistance : fichier JSON local (`data/db.json`) — aucun service externe requis

## Démarrage

```bash
npm install
npm run dev      # http://localhost:3000
```

Autres scripts :

```bash
npm run build      # build de production
npm start          # serveur de production
npm run typecheck  # vérification TypeScript
```

## Stockage des données

Les données sont écrites dans `data/db.json` (ignoré par Git). Le chemin est
configurable :

```bash
DATA_DIR=/var/lib/tesfacture npm start
```

La couche d'accès est isolée dans `lib/store.ts` : la remplacer par Prisma /
PostgreSQL ou Supabase ne touche ni les pages ni les composants.

## Structure

```
app/
  (app)/dashboard/        tableau de bord
  (app)/factures/         liste, création, détail, édition
  (app)/devis/            liste, création, détail, édition
  (app)/clients/          liste, fiche, création
  (app)/parametres/       réglages entreprise & facturation
  api/documents/[id]/pdf/ génération PDF
components/               UI, éditeur de document, actions, papier facture
lib/
  actions.ts              server actions (CRUD, statuts, conversion)
  store.ts                persistance JSON
  seed.ts                 données de démonstration + réglages par défaut
  format.ts               formats monnaie/date, calculs de totaux
  stats.ts                agrégats et indicateurs
```

## Calculs

- Ligne : `quantité × prix unitaire` (HT) puis `× (1 + TVA%)`.
- Totaux : somme des lignes HT, somme de la TVA, total TTC.
- Une facture est **en retard** si elle est envoyée, non payée et dont
  l'échéance est passée.
- Les numéros sont séquentiels par type et par année, sans trou.

## Prochaines étapes possibles

- Authentification et multi-utilisateurs (NextAuth / Supabase Auth)
- Base de données PostgreSQL + migrations
- Envoi des factures par email avec lien de paiement (Orange Money, Wave, Stripe)
- Portail client public pour consulter et télécharger ses documents
- Relances automatiques par email
