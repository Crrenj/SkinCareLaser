# BRIEF — Audit complet FARMAU (2026-06-05)

> **À LIRE EN PREMIER par chaque agent d'audit.** Ce fichier est le contrat partagé.
> Ton prompt te donne un **périmètre (WSxx)** et une **liste de fichiers**. Lis ce brief, puis audite **chaque ligne** de tes fichiers.

## 0. Le projet en 6 lignes

FARMAU = e-commerce dermo-cosmétique pour la **République Dominicaine** (marché RD, devise `DOP`, locale défaut `fr`, tri-langue FR/EN/ES via next-intl). Stack : **Next.js 15.5 App Router + React 19 + Supabase (Auth/Postgres+RLS/Storage) + Tailwind 4**. **Stade actuel = catalogue public + réservation click-&-collect** (PAS de vente en ligne : le « checkout » est volontairement un tunnel de réservation, pas un paiement). Admin = panneau de gestion à `/admin`. Cible : lancement V1.

## 1. Mission

Revue **exhaustive, ligne par ligne**, de ton périmètre. Tu cherches **tout** : bugs de correction, failles de sécurité, défauts d'architecture, erreurs de logique métier, problèmes de perf, accessibilité, i18n, SEO, intégrité des données, dette technique, code mort. Sois **concret et sévère mais juste**. Mieux vaut un constat précis avec `fichier:ligne` qu'une généralité.

## 2. Contraintes ABSOLUES (ne pas violer)

1. **AUDIT SEUL — lecture uniquement.** Tu **ne modifies AUCUN fichier de code**, tu **ne commits pas**, tu **ne corriges rien**. Ta seule écriture autorisée = **ton rapport** `WSxx-<slug>.md` dans `docs/audits/full-audit-2026-06-05/`.
2. **MCP Supabase = READ-ONLY.** Autorisé : `list_tables`, `list_migrations`, `list_extensions`, `get_advisors`, `generate_typescript_types` (pour comparer), et `execute_sql` **uniquement des SELECT**. **JAMAIS** `apply_migration`, ni `execute_sql` avec INSERT/UPDATE/DELETE/DDL, ni création de branche.
3. **Pas de `npm install`, pas de build destructif, pas de `rm`.** Tu peux lancer des commandes de lecture (`grep`, `git log`, `cat` via Read, `npx tsc --noEmit` si utile à ta vérif, lint en lecture).
4. **Code mort = preuve requise.** N'affirme « code mort / inutilisé » qu'après avoir `grep`é les imports/usages sur **tout `src/`** (`grep -rn "NomSymbole" src/`). Sinon marque confiance **basse** et formule « semble inutilisé, à confirmer ».
5. **Ne fais pas confiance aveuglément à CLAUDE.md ni aux docs.** Ils peuvent être périmés. Vérifie les affirmations contre le **code réel**. Si un écart existe, c'est un constat.
6. **Reste dans ton périmètre.** Tu peux *lire* des fichiers hors périmètre pour comprendre un usage (un import, un type, une RPC appelée), mais tu ne rapportes que les défauts **dont la cause est dans tes fichiers**. Un défaut transverse que tu remarques ailleurs → note-le en fin de rapport sous « Signalements hors périmètre » (1 ligne), ne le développe pas.

## 3. Décisions INTENTIONNELLES — NE PAS rapporter comme bugs

Ces choix sont délibérés et documentés. Les re-signaler = bruit. (Tu peux les mentionner *seulement* si tu trouves une **régression concrète** de leur mise en œuvre.)

- **Pas de paiement en ligne / checkout = placeholder.** Le projet est au stade catalogue + réservation. Ne réclame pas Stripe/paiement.
- **Click & collect uniquement.** Pas de livraison payante. Les colonnes/tarifs `shipping_*` orphelins et `lib/shipping.ts` qui hardcode une zone sont **connus** — ne pas réclamer de re-câblage des tarifs livraison.
- **`is_user_admin` garde le GRANT EXECUTE à `anon`** : OBLIGATOIRE (appelée par des policies RLS `TO public` sur tables en lecture anonyme — la révoquer casse catalogue/home/blog). Ne **jamais** suggérer de la révoquer.
- **Auth volontairement simple** : confirmation email désactivée, signup = auto-login, email éditable au profil. Ne pas réclamer de friction email.
- **Modèle « un user, deux casquettes »** : un admin = un compte client **+** une ligne `admin_users` (additif). `/account/*` est réutilisé pour le profil admin — **ne pas** suggérer de créer `/admin/account`.
- **Espagnol en dur dans les widgets `src/components/admin/dashboard/*` et `_dashboard/data.ts`** = intentionnel (seule surface admin hors i18n). Ne pas le compter comme défaut i18n (WS30 le note une fois, pas par widget).
- **CSP `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN`** : requis pour l'iframe d'aperçu `/admin/annonce`. Ne pas re-durcir à `'none'`.
- **Pas de nonce CSP** : casserait le SSG. Ne pas le proposer.
- **`venv/` (1010 fichiers) commité** = problème **connu**, traité par **WS38 uniquement**. Tous les autres agents **ignorent `venv/`, `public/`, `db/catalog.json`, `package-lock.json`, `src/lib/database.types.ts` (généré)**.

## 4. Pièges techniques connus (contexte pour juger juste)

- **Thème imbriqué** : pour qu'un `[data-theme]` imbriqué (shell admin) re-thématise, les mappings `--color-*: var(--c-*)` doivent vivre **dans** le bloc `[data-theme]` de `globals.css`, pas seulement `@theme`/`:root` (où ils se figent). 
- **`position:fixed` sous `backdrop-filter`** : un ancêtre `backdrop-filter`/`transform`/`filter` devient le bloc conteneur de ses descendants `fixed`. Les overlays (CartDrawer, Scrim, SearchOverlay, MobileDrawer, ScrollToTop) **doivent** être rendus **hors** du `<header>`.
- **Tailwind v4** : une teinte `text-ink-600`/`bg-olive-100` **non déclarée** dans `globals.css` ne génère **aucune** règle → élément invisible. 
- **`/api/theme` = `no-store`** volontaire (pas de cache CDN ; `revalidateTag` n'invalide pas l'edge).
- **POST `/api/cart` = INCRÉMENT** (`add_to_cart`) ; **PATCH `/api/cart` = quantité ABSOLUE**. Ne pas confondre.

## 5. Travail en cours à NE PAS dupliquer (mais à recouper)

- Un audit **RLS/IDOR** est en cours : `docs/audits/rls-idor-audit-2026-06-05.md` (modifié, non commité) + une migration **non commitée** `supabase/migrations/20260605120000_cart_rls_withcheck_and_revokes.sql`. **WS24 (RLS/DB security)** possède ce sujet : il doit lire ces deux fichiers, juger la correction de la migration non commitée, et signaler ce qui reste ouvert. Les autres agents n'y touchent pas.
- Findings historiques (audit « Lanjo », mémoire) à **vérifier dans l'état actuel** (peuvent avoir été corrigés par les commits sécu récents `f908ec1`/`53e1627`/`b686366`) — rapporte le **statut réel**, ne re-copie pas l'historique : (a) rate-limit par IP **spoofable** (en-tête `x-forwarded-for`), (b) **open-redirect** au login (`redirectedFrom`/`next`), (c) CSP `unsafe-eval`.

## 6. Barème de sévérité

- **P0 — Bloquant** : faille exploitable (auth bypass, IDOR, injection, secret exposé, RLS manquante sur donnée sensible), perte/corruption de données, flux cœur cassé (impossible d'ajouter au panier / de réserver), build cassé.
- **P1 — Majeur** : bug touchant beaucoup d'utilisateurs, faiblesse sécu réelle (non trivialement exploitable mais risquée), feature non-cœur cassée, risque d'intégrité, gros trou a11y/SEO/i18n, fuite de logique service-role.
- **P2 — Mineur** : bug localisé / cas limite, validation manquante à faible risque, inefficacité perf mesurable, smell à impact réel, souci a11y/i18n modéré.
- **P3 — Cosmétique / Dette** : nit, style, micro-optim, code mort mineur, dérive de doc.

## 7. Format de SORTIE (ton rapport `WSxx-<slug>.md`)

Écris **un seul fichier** à `docs/audits/full-audit-2026-06-05/WSxx-<slug>.md`, structuré ainsi :

```markdown
# WSxx — <Titre du périmètre>

**Périmètre** : <liste des fichiers/dossiers audités>
**Fichiers lus** : <N> · **Lignes parcourues (approx.)** : <N>
**Synthèse** : P0=<n> · P1=<n> · P2=<n> · P3=<n>

## Findings

### [WSxx-01] <Titre court> — P<0..3>
- **Fichier** : `chemin/relatif:ligne(s)`
- **Catégorie** : sécurité | bug | archi | perf | a11y | i18n | seo | data | logique-métier | dette
- **Constat** : <ce qui ne va pas, factuel>
- **Impact** : <conséquence concrète>
- **Reco** : <correctif proposé, précis>
- **Confiance** : haute | moyenne | basse

### [WSxx-02] ...

## Points positifs (court)
- <2-5 choses bien faites, pour calibrer>

## Signalements hors périmètre (1 ligne chacun, max 5)
- <défaut remarqué ailleurs>

## Zones non couvertes / à re-vérifier humainement
- <ce que tu n'as pas pu trancher>
```

Règles : numérote tes findings `WSxx-NN`. **Toujours** un `fichier:ligne`. Pas de finding sans impact concret. Si **zéro** défaut sur un fichier, ne l'invente pas — c'est un bon signe.

## 8. Ce que tu retournes à l'orchestrateur (message final, COMPACT)

Ne recopie pas tout le rapport. Retourne **uniquement** :
1. Le **chemin** de ton rapport.
2. Les **compteurs** P0/P1/P2/P3.
3. Les **titres P0 et P1** en une ligne chacun (avec `fichier:ligne`).
4. **1 phrase** de verdict sur la santé de ton périmètre.

C'est tout. Le détail vit dans ton fichier.
