# WS08 — En-têtes HTTP & Configuration Web

Audit PRE-V1 · 2026-05-28 · **LECTURE SEULE** · FARMAU (Next.js 15.5 App Router, Vercel, RD/DOP)

Portée : `next.config.ts` (headers, CSP, images), `src/middleware.ts` (matcher), `src/app/robots.ts`, `src/app/sitemap.ts`, cookies (flags config), CORS. Re-vérification post-audit 145-findings (CSP + Permissions-Policy ajoutés au commit `5f4a379`).

---

## Verdict

**Note : B (bon socle, 2 corrections fonctionnelles à faire avant V1).**

Le commit `5f4a379` a posé un socle d'en-têtes correct et au-dessus de la moyenne pour un projet à ce stade : 5 en-têtes de sécurité, CSP réelle avec `object-src 'none'` / `base-uri 'self'` / `form-action 'self'`, `frame-src`/`connect-src` scopés. Le matcher middleware et `robots.ts` sont sains.

Deux problèmes méritent attention **avant V1**, et tous deux sont **fonctionnels avant d'être sécuritaires** :

1. **`frame-src` casse les cartes Google Maps** (`/contact` + `/pharmacie`) en production — la CSP autorise `accounts.google.com` mais pas `maps.google.com`/`www.google.com`. **WS08-01, P1.** C'est le seul finding qui dégrade visiblement le site en prod.
2. **`images.remotePatterns: hostname: '**'`** ouvre l'optimizer Next/Image à n'importe quel domaine HTTPS (proxy/coût/SSRF léger). **WS08-02, P1.**

Reste : pas de **HSTS** (P1, trivial sur Vercel HTTPS), pas de **`frame-ancestors`** dans la CSP (P2 — `X-Frame-Options: DENY` couvre le legacy), CSP `script-src` avec `'unsafe-inline' 'unsafe-eval'` (P2 — partiellement justifié, voir analyse). Aucune CSP faible n'est P0 ici car **aucune XSS persistante exploitable connue** (le blog passe par `DOMPurify`, finding fermé session 2026-05-28).

---

## Tableau des en-têtes

Source unique : `next.config.ts:13-52`, appliqué à `source: '/(.*)'` (toutes les routes, y compris `/api`).

| En-tête | Présent | Valeur actuelle | Reco |
|---|---|---|---|
| `X-Frame-Options` | ✅ | `DENY` | OK (garder en plus de `frame-ancestors`) |
| `X-Content-Type-Options` | ✅ | `nosniff` | OK |
| `Referrer-Policy` | ✅ | `same-origin` | OK (strict ; `strict-origin-when-cross-origin` si besoin de referer cross-site) |
| `Permissions-Policy` | ✅ | `camera=(), microphone=(), geolocation=()` | Élargir (voir WS08-05) |
| `Content-Security-Policy` | ✅ | voir analyse directive par directive | Corriger `frame-src` (WS08-01), durcir `script-src` (WS08-07) |
| `Strict-Transport-Security` (HSTS) | ❌ | — | **Ajouter** `max-age=63072000; includeSubDomains; preload` (WS08-03) |
| `frame-ancestors` (CSP) | ❌ | — | Ajouter `frame-ancestors 'none'` à la CSP (WS08-04) |
| `Cross-Origin-Opener-Policy` (COOP) | ❌ | — | `same-origin` optionnel (WS08-06, P2) |
| `Cross-Origin-Resource-Policy` (CORP) | ❌ | — | Non requis (pas de partage cross-origin de ressources) |
| `Cross-Origin-Embedder-Policy` (COEP) | ❌ | — | **Ne pas ajouter** — casserait les iframes Maps + images cross-origin |
| `X-DNS-Prefetch-Control` | ❌ | — | `on` optionnel (perf, P3) |
| `Access-Control-Allow-Origin` (CORS) | ✅ absent | — | Sain : aucune route API ne pose de CORS → same-origin par défaut |

---

## Findings

### WS08-01 · **P1** · CSP `frame-src` casse les cartes Google Maps · **confirmé**
- **Preuve** : `next.config.ts:43` → `"frame-src 'self' https://accounts.google.com"`. Les pages `src/app/[locale]/contact/page.tsx:151` et `src/app/[locale]/pharmacie/page.tsx:81` chargent un `<iframe src="https://maps.google.com/maps?q=...&output=embed">`.
- **Impact** : en production, le navigateur **bloque l'iframe Maps** (host `maps.google.com` absent du `frame-src`). Les deux pages clés du parcours « venir en pharmacie » (cœur du modèle click & collect) affichent un cadre vide. Régression fonctionnelle visible dès le déploiement de la CSP.
- **Reco** : ajouter les hosts Maps au `frame-src` :
  `"frame-src 'self' https://accounts.google.com https://maps.google.com https://www.google.com"`
  (le `output=embed` peut rediriger vers `www.google.com/maps/embed`). Ne PAS ouvrir `https:` global.
- **Effort** : 2 min (1 ligne).

### WS08-02 · **P1** · `images.remotePatterns` accepte tout host HTTPS · **confirmé**
- **Preuve** : `next.config.ts:61-67` → `{ protocol: 'https', hostname: '**', pathname: '/**' }`.
- **Impact** : l'optimizer Next/Image (`/_next/image?url=...`) accepte n'importe quelle URL HTTPS → un tiers peut faire transiter/cacher des images arbitraires via votre domaine (coût bande passante/fonctions Vercel, light SSRF / fetch côté serveur vers des hosts arbitraires, amplification). Les images réelles ne proviennent que de Supabase Storage + `data:`/`blob:` locales.
- **Reco** : restreindre à l'allowlist réelle :
  ```ts
  remotePatterns: [
    { protocol: 'https', hostname: 'adxpoxcynrpnbbxnncsk.supabase.co', pathname: '/storage/v1/object/public/**' },
  ]
  ```
  (vérifier le host Storage exact ; ajouter d'autres CDN seulement si réellement utilisés).
- **Effort** : 5 min. Risque de régression faible (vérifier qu'aucune image produit ne pointe hors Supabase).

### WS08-03 · **P1** · HSTS absent · **confirmé**
- **Preuve** : aucun `Strict-Transport-Security` dans `next.config.ts` ni `vercel.json` (absent).
- **Impact** : pas de forçage HTTPS côté navigateur → fenêtre SSL-strip / downgrade au premier accès (MITM réseau). Vercel sert en HTTPS mais ne pose pas HSTS automatiquement sur domaine custom.
- **Reco** : ajouter dans le bloc headers :
  `{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }`.
  Confirmer que **tous** les sous-domaines de `farmau.do` servent en HTTPS avant `includeSubDomains`/`preload`.
- **Effort** : 5 min.

### WS08-04 · P2 · CSP sans `frame-ancestors` · **confirmé**
- **Preuve** : la CSP `next.config.ts:36-47` n'a pas de directive `frame-ancestors`. `X-Frame-Options: DENY` (`:20`) est présent.
- **Impact** : faible — `X-Frame-Options: DENY` couvre le clickjacking sur tous les navigateurs courants. `frame-ancestors` est le standard moderne (gère les origines multiples, prioritaire sur XFO quand les deux divergent).
- **Reco** : ajouter `"frame-ancestors 'none'"` à la liste CSP. Garder `X-Frame-Options` en ceinture+bretelles.
- **Effort** : 1 min.

### WS08-05 · P2 · `Permissions-Policy` peut être élargie · **confirmé**
- **Preuve** : `next.config.ts:32` → `camera=(), microphone=(), geolocation=()`.
- **Impact** : faible. Les capteurs sensibles sont bloqués. Manquent quelques directives à coût nul (le site n'utilise aucune de ces APIs) : `payment`, `usb`, `interest-cohort` (FLoC), `accelerometer`, `gyroscope`, `magnetometer`.
- **Reco** : `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), accelerometer=(), gyroscope=(), magnetometer=()`.
- **Effort** : 2 min.

### WS08-06 · P2 · COOP absent · **suspecté/optionnel**
- **Preuve** : aucun `Cross-Origin-Opener-Policy`.
- **Impact** : faible. COOP `same-origin` isole le browsing context des popups cross-origin (mitigation Spectre/XS-Leaks). Le site n'utilise pas `window.open` cross-origin sensible. **Attention** : le flow OAuth Supabase/Google se fait par redirect (pas par popup `postMessage`) → `same-origin` ne devrait pas le casser, mais à tester. Ne PAS ajouter COEP (casserait Maps + images Supabase non-CORP).
- **Reco** : optionnel `Cross-Origin-Opener-Policy: same-origin` après test du flow Google. Sinon laisser.
- **Effort** : 5 min + test auth.

### WS08-07 · P2 · CSP `script-src 'unsafe-inline' 'unsafe-eval'` · **confirmé (partiellement justifié)**
- **Preuve** : `next.config.ts:38` → `"script-src 'self' 'unsafe-inline' 'unsafe-eval'"`.
- **Analyse** :
  - **`'unsafe-inline'` partiellement justifié** : le `<head>` contient un `<script dangerouslySetInnerHTML>` anti-flash écrit à la main (`src/app/layout.tsx:46,66`, `THEME_MODE_SCRIPT`) + des `<script type="application/ld+json">` (JSON-LD, non concernés par `script-src` mais inertes). Next.js App Router injecte aussi du bootstrap inline. Sans nonce/hash, `'unsafe-inline'` est requis pour que `THEME_MODE_SCRIPT` s'exécute.
  - **`'unsafe-eval'` non justifié en production** : aucun `eval()`/`new Function()` applicatif (grep `eval(` → 0 hit hors `dangerouslySetInnerHTML`). C'est typiquement requis par le **dev runtime/HMR de Next**, pas par le build prod. Le retirer en prod ne devrait rien casser (à valider après build).
- **Impact** : `'unsafe-inline'` annule l'essentiel de la protection XSS de la CSP. Calibré **P2 et non P0** car aucune XSS persistante connue n'est ouverte (blog `DOMPurify`, JSON-LD via `JSON.stringify`, autres `dangerouslySetInnerHTML` = traductions statiques contrôlées). La CSP reste une défense-en-profondeur dégradée mais non un trou exploitable seul.
- **Reco (réaliste, par ordre d'effort)** :
  1. **Quick win** : retirer `'unsafe-eval'` du `script-src` en production (le garder hors prod si HMR le réclame). Effort : 5 min + 1 build de validation.
  2. **Durcissement moyen** : remplacer `'unsafe-inline'` par un **hash SHA-256** du `THEME_MODE_SCRIPT` (script statique → hash stable, calculable au build). Les inline de Next se gèrent ensuite via nonce middleware. Effort : moyen (le nonce par requête force un middleware sur toutes les routes → perd l'avantage SSG, à peser).
  3. **Documenter le résiduel** si on garde `'unsafe-inline'` : acceptable tant que toute insertion HTML dynamique reste sanitisée (DOMPurify) — à inscrire comme invariant.
- **Effort** : 5 min (étape 1) à 1/2 j (étape 2 avec nonce).

### WS08-08 · P2 · Cookie `cart_id` sans flag `Secure` · **confirmé**
- **Preuve** : `src/app/api/cart/route.ts:27-31` → `cookieStore.set('cart_id', ..., { maxAge, sameSite:'lax', httpOnly:true })` — pas de `secure: true`.
- **Impact** : faible. Le cookie est un UUID de panier anonyme (non sensible, `httpOnly`), mais en l'absence de `Secure` il peut transiter en clair sur une connexion dégradée (mitigé par HSTS une fois WS08-03 posé). Le cookie de session Supabase, lui, est posé `secure` en prod via le middleware (`src/middleware.ts:64,73`) — OK.
- **Reco** : `secure: process.env.NODE_ENV === 'production'` sur le `set` de `cart_id` (cohérence avec le middleware).
- **Effort** : 2 min.

### WS08-09 · P3 · `X-DNS-Prefetch-Control` absent · **suspecté/optionnel**
- **Preuve** : non posé. Impact perf marginal, pas sécu.
- **Reco** : optionnel `X-DNS-Prefetch-Control: on`. Effort : 1 min.

---

## CSP analysée directive par directive

CSP brute (`next.config.ts:36-47`) :

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com;
frame-src 'self' https://accounts.google.com;
object-src 'none';
base-uri 'self';
form-action 'self';
```

| Directive | Valeur | Verdict | Note |
|---|---|---|---|
| `default-src` | `'self'` | ✅ Sain | Bonne base restrictive. |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval'` | ⚠️ WS08-07 | `'unsafe-inline'` requis par le script anti-flash inline ; `'unsafe-eval'` retirable en prod. |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | ✅ Acceptable | `'unsafe-inline'` requis par Tailwind/styles inline React. **`https://fonts.googleapis.com` inutile** : `next/font/google` (`layout.tsx:2,9,17`) **self-héberge** les fonts (servies depuis `/_next/static`). Peut être retiré (P3, cosmétique). |
| `font-src` | `'self' https://fonts.gstatic.com` | ✅ Acceptable | Idem : `next/font` self-héberge → `gstatic.com` théoriquement inutile. Inoffensif. Garder ou nettoyer (P3). |
| `img-src` | `'self' data: blob: https:` | ⚠️ Large | `https:` autorise toute image HTTPS distante. Cohérent avec `remotePatterns: '**'` (WS08-02) mais aussi large. À resserrer en même temps que WS08-02 vers le host Supabase. Garder `data:`/`blob:` (favicons par thème, previews). |
| `connect-src` | `'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com` | ✅ Sain | Couvre le projet `adxpoxcynrpnbbxnncsk.supabase.co` (REST + Realtime WSS) + OAuth Google. **Resend** n'est appelé que **côté serveur** (`src/lib/resend.ts`) → pas besoin dans `connect-src`. Aucune analytics → rien à ajouter. |
| `frame-src` | `'self' https://accounts.google.com` | ❌ WS08-01 | **Manque `maps.google.com`/`www.google.com`** → casse les iframes Maps de `/contact` + `/pharmacie`. |
| `object-src` | `'none'` | ✅ Sain | Bloque plugins/Flash/applet. |
| `base-uri` | `'self'` | ✅ Sain | Empêche l'injection de `<base>` (vol de chemins relatifs). |
| `form-action` | `'self'` | ✅ Sain | Empêche l'exfiltration via `<form action>` externe. |
| `frame-ancestors` | _absent_ | ⚠️ WS08-04 | À ajouter (`'none'`), même si `X-Frame-Options: DENY` couvre déjà. |
| `upgrade-insecure-requests` | _absent_ | P3 | Optionnel — force les sous-ressources HTTP→HTTPS. À ajouter une fois HSTS posé. |

---

## Points sains (à conserver)

- **Headers appliqués globalement** sur `source: '/(.*)'` → couvre aussi `/api/*` et `/admin/*` (pas seulement les pages publiques). Bon réflexe.
- **Aucun en-tête CORS manuel** sur les routes API (`grep` exhaustif : 0 `Access-Control-Allow-*`, 0 `headers.set`) → comportement same-origin par défaut de Next, ce qui est le bon défaut pour une app sans API publique cross-origin.
- **Matcher middleware** (`src/middleware.ts:127`) `'/((?!api|_next|.*\\..*).*)'` + le passthrough explicite en tête de fonction (`:24-30` exclut `/api`, `/_next`, fichiers à extension) → double barrière, pas de fuite de route. Les routes `/api/*` ne dépendent PAS du middleware pour leur auth : elles ont chacune `requireAdmin()` (admin) ou une dérivation d'identité serveur (public). Exclure `/api` du matcher ne crée donc pas de trou.
- **`robots.ts`** (`src/app/robots.ts`) : `disallow` couvre `/admin/`, `/api/`, `/account/`, `/auth/`, `/cart`, `/*/cart` (le wildcard locale est bien géré) ; `sitemap` + `host` référencés. Correct.
- **`sitemap.ts`** : n'énumère que des **slugs de contenu public** (produits actifs `is_active=true`, brands, besoins, posts publiés `is_published=true`, pages statiques publiques). **Aucune URL privée/admin/account ne fuit.** hreflang complet 3 locales (angle SEO couvert par WS dédié).
- **Cookie de session Supabase** posé `secure` en prod + `sameSite:'lax'` via le middleware (`src/middleware.ts:63-64,72-73`).
- **Cookie `cart_id`** déjà `httpOnly:true` (finding sécu #3 fermé) — manque seulement `secure` (WS08-08).
- **`compress: true`** (`next.config.ts:75`) : gzip/brotli — bénéfique, pas de risque (HTTPS-only via HSTS écarte BREACH/CRIME sur du contenu non-réfléchi-secret ; le site ne reflète pas de secret CSRF dans le body compressé).
- **`generateEtags: false`** (`:78`) : neutre côté sécurité. Léger impact perf (perte de revalidation conditionnelle 304 sur certaines réponses) mais le caching Vercel/CDN prime — acceptable.

---

## Récapitulatif priorisé

| ID | Sév | Sujet | Confirmé | Effort |
|---|---|---|---|---|
| WS08-01 | **P1** | `frame-src` casse Google Maps (/contact, /pharmacie) | ✅ | 2 min |
| WS08-02 | **P1** | `images.remotePatterns: '**'` → optimizer ouvert | ✅ | 5 min |
| WS08-03 | **P1** | HSTS absent | ✅ | 5 min |
| WS08-04 | P2 | CSP sans `frame-ancestors` | ✅ | 1 min |
| WS08-05 | P2 | `Permissions-Policy` à élargir | ✅ | 2 min |
| WS08-06 | P2 | COOP absent (optionnel, tester OAuth) | suspecté | 5 min |
| WS08-07 | P2 | `script-src 'unsafe-inline'/'unsafe-eval'` | ✅ | 5 min→½ j |
| WS08-08 | P2 | Cookie `cart_id` sans `Secure` | ✅ | 2 min |
| WS08-09 | P3 | `X-DNS-Prefetch-Control` absent | optionnel | 1 min |

**Aucun P0.** Les trois P1 sont des correctifs de 2-5 min chacun. WS08-01 est le plus urgent car il dégrade visiblement deux pages clés du parcours click & collect dès le déploiement de la CSP.
