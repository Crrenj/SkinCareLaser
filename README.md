# FARMAU — Catalogue & réservation dermo-cosmétique

Next.js 15 + TypeScript + Supabase + Tailwind. Catalogue produits + réservation (click & collect) + dashboard admin, pour une pharmacie. Marché : République Dominicaine. (Pas de vente en ligne — le checkout est volontairement un placeholder.)

Voir **`CLAUDE.md`** pour l'architecture détaillée et **`db/README.md`** pour la base.

## Démarrage

```bash
npm install
cp .env.local.example .env.local   # éditer avec tes clés Supabase
npm run dev                        # http://localhost:3000
```

## Variables d'environnement requises

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # ou SUPABASE_SERVICE_KEY (les deux noms acceptés)
```

## Bootstrap d'un nouveau projet Supabase

1. Créer le projet sur supabase.com
2. SQL Editor → exécuter `db/schema.sql` (tables + RLS + RPC + buckets)
3. Créer le compte admin :
   ```bash
   npm run create-admin -- admin@example.com motdepasse
   ```
   Puis dans SQL Editor (`admin_users` est la source de vérité ; la colonne `profiles.is_admin` a été supprimée) :
   ```sql
   INSERT INTO public.admin_users (user_id, role) VALUES ('<uuid>', 'super_admin');
   ```
4. Seed du catalogue depuis `contenu_bd/` :
   ```bash
   npm run parse-pdfs              # → db/catalog.json (déjà fait, idempotent)
   npm run seed-import -- --dry-run
   npm run seed-import             # import réel + upload images/PDFs
   ```

## Commandes utiles

```bash
npm run dev                   # serveur dev avec Turbopack
npm run build && npm start    # build production
npm run lint                  # ESLint
npm run test                  # Playwright E2E (lance dev server auto)
npm run test:unit             # Vitest unit tests
npm run check-products        # diagnostic Supabase
```

## Stack

- **Next.js 15** App Router, React 19, TypeScript strict, Turbopack
- **Supabase** : Auth, Postgres + RLS, Storage (buckets `product-image` + `brand-fiche`)
- **Tailwind 4** + Lucide React + react-icons · polices `next/font` : Instrument Serif + Be Vietnam Pro + JetBrains Mono
- **next-intl** (FR/EN/ES) · **SWR** (panier, thème) · **Vitest** + **Playwright** pour les tests
