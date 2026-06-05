# WS06 — Pages About + éditoriales

**Périmètre** : `src/app/[locale]/a-propos/page.tsx`, `manifeste/page.tsx`, `faq/page.tsx`, `pharmacie/page.tsx`, `livraison/page.tsx` · `src/components/about/*` (AboutHero, AboutStats, AboutManifest, AboutTeam, AboutCriteria, AboutVisit, AboutPartner, AboutLeaveReview, AboutCta, AboutSectionHead)
**Fichiers lus** : 15 (+ 5 hors-périmètre pour contexte : getShopSettings, supabaseServer, seo, middleware, layout) · **Lignes parcourues (approx.)** : ~1 700
**Synthèse** : P0=0 · P1=1 · P2=7 · P3=5

## Findings

### [WS06-01] Page `/pharmacie` : tous les contacts (téléphone/WhatsApp/email) disparaissent en rendu statique — P1
- **Fichier** : `src/app/[locale]/pharmacie/page.tsx:49-52,117-150` ; cause racine : `src/lib/getShopSettings.ts:45-63` + `src/lib/supabaseServer.ts:10` (cf. WS35-01).
- **Catégorie** : bug / data / logique-métier
- **Constat** : la page déclare `export const revalidate = 86400` (ligne 16) mais appelle `getShopSettings()` (ligne 49), qui lit `cookies()` via `createSupabaseServerClient`. Sur une page SSG, `cookies()` lève `DynamicServerError` ; ce signal est **avalé par le `catch`** de `getShopSettings` (ligne 59) qui retourne `FALLBACK` (tous les champs contact à `null`). Les trois blocs contact sont conditionnés à `settings.X` truthy (`phoneHref && settings.contact_phone` l.117, `waHref && settings.whatsapp_number` l.128, `emailHref && settings.contact_email` l.141) → avec FALLBACK ils sont **tous les trois non rendus**. La carte « infos contact » n'affiche plus que le label, le nom et l'adresse (qui viennent de l'i18n), **sans aucun moyen de contact ni d'action**. Vérifié contre la DB : les vraies valeurs existent (`contact_phone +1 809 724 3940`, `whatsapp_number +18094122468`, `contact_email contact@farmau.do`) mais ne s'affichent jamais.
- **Impact** : la page « pharmacie » (page de conversion click-&-collect) perd téléphone, bouton WhatsApp et email en production. Idem effet dégradé sur `AboutVisit` (bouton WhatsApp non rendu l.152, email caché), `AboutCta` (WhatsApp non rendu l.31) et `AboutPartner`/`AboutVisit` qui retombent sur le littéral en dur `'+1 809 724 3940'`. L'admin édite ces infos dans `/admin/settings` mais elles n'apparaissent jamais.
- **Reco** : corriger à la racine via WS35-01 (refaire `getShopSettings` sur le modèle `getThemeConfig` : client anon sans cookies + `unstable_cache`). Tant que ce n'est pas fait, la page pharmacie est la plus visiblement cassée du périmètre. Recouper avec WS35-01 (qui possède le correctif).
- **Confiance** : haute (mécanisme confirmé par WS35, valeurs DB vérifiées par SELECT).

### [WS06-02] FAQ : email de contact `skin@skinlacercenter.net` erroné/typo pour annulation + demande RGPD — P2
- **Fichier** : `src/messages/{fr,es,en}.json` → `Faq.sections.reservation.q4.a` et `Faq.sections.privacy.q3.a` (rendu via `src/app/[locale]/faq/page.tsx:98-103` `dangerouslySetInnerHTML`).
- **Catégorie** : data / logique-métier (privacy)
- **Constat** : deux réponses FAQ pointent l'utilisateur vers `mailto:skin@skinlacercenter.net` — présenté comme l'email FARMAU (« écrivez-**nous** »). Or (1) le `contact_email` réel en DB est `contact@farmau.do`, donc deux emails de contact FARMAU se contredisent ; (2) le domaine `skinla**c**ercenter.net` diverge de la marque du partenaire elle-même : `AboutPartner.tsx:7` utilise `https://www.facebook.com/skinla**s**ercenter/` (s, pas c). L'un des deux est un typo. La réponse `privacy.q3` route les **demandes Ley 172-13 (droits sur données personnelles, réponse sous 30 jours)** vers cet email — c'est-à-dire vers le domaine d'une **clinique tierce** (et probablement une adresse inexistante si le `c` est faux). Même email utilisé dans `reservation.q4` pour annuler une réservation.
- **Impact** : demandes d'annulation et requêtes RGPD/Ley 172-13 envoyées à une adresse tierce, voire à un domaine mal orthographié (mail rejeté silencieusement). Risque conformité (le responsable de traitement FARMAU doit recevoir les demandes data-subject, pas une clinique partenaire) + perte de demandes d'annulation.
- **Reco** : remplacer par `contact@farmau.do` (valeur DB) pour les contacts FARMAU, OU confirmer la bonne adresse partenaire et corriger l'orthographe (`skinlasercenter` ?). Idéalement, ne pas coder l'email en dur dans l'i18n : ces réponses devraient référencer `contact_email` de `shop_settings`. Le même email apparaît dans 6 pages légales (hors périmètre — cf. signalements).
- **Confiance** : haute (divergence DB + divergence interne c/s vérifiées par grep).

### [WS06-03] Horaires d'ouverture incohérents sur 4 surfaces — P2
- **Fichier** : `src/messages/fr.json` → `Pharmacie.hoursWeekday/Saturday`, `Delivery.practical.hoursWeekday`, `About.visit.hoursMonFriValue/hoursSatValue/hoursHolidaysValue` ; rendu par `pharmacie/page.tsx:109-115`, `livraison/page.tsx:110-115`, `AboutVisit.tsx:113-123`.
- **Catégorie** : data
- **Constat** : la même pharmacie FARMAU affiche **quatre jeux d'horaires différents** :
  - DB `shop_settings.pickup_hours` : `Lun-Vie 6h30-17h · Sáb 8h-16h`
  - `/pharmacie` (i18n) : `Lun-Ven 9h-19h · Sáb 9h-14h`
  - `/livraison` (i18n) : `Lun-Ven 9h-19h`
  - `AboutVisit` (i18n) : `Lun-Ven 8h-20h · Sáb 9h-18h · Jours fériés 9h-13h`
  - (`AboutPartner.hoursBody` = `Lun-Ven 6h30-17h` — mais c'est censé être la clinique *Skin Laser Center*, pas FARMAU ; il matche ironiquement les horaires FARMAU de la DB.)
- **Impact** : information client contradictoire et fausse sur les heures d'ouverture d'un commerce physique — le client peut se déplacer en horaire fermé. Aussi un signal de non-fiabilité.
- **Reco** : source unique. Idéalement lire `pickup_hours` de `shop_settings` partout (au lieu de 3 copies i18n divergentes), ou a minima aligner les 3 textes i18n sur la valeur réelle après confirmation des vrais horaires.
- **Confiance** : haute (4 valeurs littérales comparées).

### [WS06-04] About : « 60+ marques » contredit le catalogue réel (13 marques) — P2
- **Fichier** : `src/messages/{fr,es,en}.json` → `About.stats.brandsValue` (= `"60+"`), rendu `AboutStats.tsx:13`. Aussi `About.partner`/copy diverses mentionnent des volumes.
- **Catégorie** : data
- **Constat** : la bande de stats annonce `60+` marques. La DB compte **13 brands**. `refsValue` = `353` matche bien (353 produits actifs en DB) ; `teamValue` = `7 farmacéuticos` et `yearsValue` = `12 ans` sont des placeholders non vérifiables (à confirmer). Le `60+` est directement contredisable par l'utilisateur en ouvrant `/marques` (13 marques listées).
- **Impact** : affirmation chiffrée fausse et vérifiable en deux clics — érode la crédibilité, juste à côté d'un `353` exact. (Le brief classe les placeholders comme « à confirmer » ; ici c'est une contradiction factuelle avec une donnée du même écran, d'où P2.)
- **Reco** : corriger en `13` (ou retirer le compteur marques tant que le catalogue est petit). Idéalement, dériver le compteur d'un count DB côté serveur comme le fait la home (`HomeHero` affiche les compteurs réels produits/marques).
- **Confiance** : haute (SELECT count brands = 13).

### [WS06-05] Liens internes dans les réponses FAQ non préfixés par la locale — P2
- **Fichier** : `src/app/[locale]/faq/page.tsx:98-103` (`dangerouslySetInnerHTML` sur `…a`) ; cibles dans `Faq.sections.*.a` (`/besoins/hydratation`, `/a-propos`, `/account/security`, `/forgot-password`, `/legal/confidentialite`, `/legal/cookies`).
- **Catégorie** : i18n / bug
- **Constat** : les réponses FAQ contiennent des `<a href="/…">` bruts injectés en HTML. Contrairement aux `Link` de `@/i18n/navigation`, ces ancres ne sont **pas** localisées. Avec `routing.localePrefix: 'always'` (vérifié `src/middleware.ts:42-43` + `intlMiddleware`), un utilisateur sur `/es/faq` ou `/en/faq` qui clique `/account/security` atteint un path non préfixé → le middleware redirige selon la détection Accept-Language/cookie, pas selon la locale courante de la page. Les hrefs sont identiques dans les 3 fichiers de langue (confirmé), donc le problème touche ES et EN.
- **Impact** : un visiteur ES/EN perd sa locale (bascule possible vers FR par défaut) + redirection supplémentaire à chaque lien FAQ interne. Dégradation UX/i18n (les liens fonctionnent mais peuvent changer de langue).
- **Reco** : préfixer les hrefs i18n par la locale (les rendre `/{locale}/...`) — soit en passant la locale dans la chaîne, soit en post-traitant le HTML, soit en remplaçant ces réponses-à-liens par un rendu `t.rich` avec un composant `Link` localisé au lieu de `dangerouslySetInnerHTML`.
- **Confiance** : moyenne (le résultat exact dépend de la résolution Accept-Language/cookie de next-intl ; dégradation certaine, ampleur variable).

### [WS06-06] WhatsApp en dur `wa.me/18094122468` dans la FAQ au lieu de `shop_settings` — P2
- **Fichier** : `src/app/[locale]/faq/page.tsx:122`.
- **Catégorie** : dette / data
- **Constat** : le CTA WhatsApp de la FAQ pointe en dur sur `https://wa.me/18094122468`. La valeur matche aujourd'hui `whatsapp_number` en DB (`+18094122468`), mais elle est figée dans le code : un changement du numéro via `/admin/settings` ne se répercute pas ici. Les pages pharmacie/about lisent (elles) `settings.whatsapp_number`.
- **Impact** : risque de numéro WhatsApp obsolète sur la FAQ après modification admin → messages perdus. Incohérence d'approche avec le reste du périmètre.
- **Reco** : lire `getShopSettings().whatsapp_number` + `whatsappHref()` comme ailleurs (une fois WS06-01/WS35-01 réglé pour que la valeur ne soit pas FALLBACK).
- **Confiance** : haute.

### [WS06-07] FAQ sans données structurées `FAQPage` (rich results perdus) — P2
- **Fichier** : `src/app/[locale]/faq/page.tsx` (aucun JSON-LD).
- **Catégorie** : seo
- **Constat** : la page FAQ (5 sections, 19 Q&A) n'émet aucun `FAQPage` schema.org. Le projet a déjà des JSON-LD ailleurs (`ProductJsonLd`, `BlogPostJsonLd`, `CollectionPage` sur catalogue/marques — vérifié par grep), donc le pattern existe et est maîtrisé.
- **Impact** : perte des rich results FAQ Google (accordéons directement dans la SERP) — un des gains SEO les plus rentables pour une page Q&A.
- **Reco** : ajouter un composant `FaqJsonLd` (`@type: FAQPage` avec `mainEntity` = liste de `Question`/`acceptedAnswer`) construit à partir des mêmes clés i18n.
- **Confiance** : haute.

### [WS06-08] Pages pharmacie/about sans `LocalBusiness`/`Pharmacy` schema (SEO local) — P2
- **Fichier** : `src/app/[locale]/pharmacie/page.tsx`, `src/app/[locale]/a-propos/page.tsx` (aucun JSON-LD).
- **Catégorie** : seo
- **Constat** : aucune donnée structurée `Pharmacy`/`LocalBusiness` (NAP : nom, adresse, téléphone, horaires, geo) n'est émise, alors que c'est un commerce physique unique à Santiago RD avec adresse, horaires et coordonnées Maps connues (lat/lng présents dans les URL Maps en dur de `AboutLeaveReview.tsx:6` / `AboutPartner.tsx:9`).
- **Impact** : SEO local sous-exploité (Knowledge Panel, Google Maps, requêtes « pharmacie dermo Santiago »). Pour un click-&-collect mono-établissement, c'est un levier majeur.
- **Reco** : émettre `@type: Pharmacy` (sous-type de `LocalBusiness`) avec `name/address/telephone/openingHours/geo/url` issus de `shop_settings` + des coordonnées déjà disponibles.
- **Confiance** : haute.

### [WS06-09] Données placeholder équipe + n° d'enregistrement sanitaire — P3
- **Fichier** : `src/messages/fr.json` → `About.team.{leadName,m2Name,m3Name}` (`Dra. María Pérez Espinal`, `Lic. Andrés Reyes`, `Lic. Yarisa Tavárez`), `About.hero.metaRegValue` (`DGM-42-2014`), `About.criteria.cert*`.
- **Catégorie** : data / dette
- **Constat** : noms d'équipe, citations attribuées, et numéro « Reg. sanitaire DGM-42-2014 » sont des placeholders (cohérent avec `AboutTeam` qui ne dispose que de silhouettes SVG, pas de photos). Signalé par le brief comme « à confirmer », pas bug bloquant.
- **Impact** : contenu fictif visible publiquement avant lancement (noms et n° réglementaire faux) — risque réputationnel/légal mineur si publié tel quel.
- **Reco** : remplacer par les vraies données avant V1 (déjà tracé dans CLAUDE.md « Reste à faire »).
- **Confiance** : haute.

### [WS06-10] Pages éditoriales sans `og:image` — P3
- **Fichier** : `a-propos/page.tsx:32-37`, `manifeste:32-38`, `faq:33-39`, `pharmacie:32-38`, `livraison:25-31` (blocs `openGraph` sans `images`).
- **Catégorie** : seo
- **Constat** : aucune des 5 pages ne définit `openGraph.images`. Le root layout (`src/app/layout.tsx:41-44`) ne fournit qu'un `siteName`/`type`, pas d'image par défaut. Les partages sociaux n'auront pas de visuel.
- **Impact** : aperçus sociaux sans image (CTR partage réduit). Cohérent sur tout le site, donc impact diffus.
- **Reco** : ajouter une image OG par défaut (statique de marque) au niveau layout, ou par page.
- **Confiance** : haute.

### [WS06-11] FAQ : libellés de catégories en `<div>` plutôt qu'en titres (a11y) — P3
- **Fichier** : `src/app/[locale]/faq/page.tsx:75-77`.
- **Catégorie** : a11y / seo
- **Constat** : les 5 regroupements (Réservation, Produits, Compte, Livraison, Confidentialité) sont rendus en `<div>` stylé, pas en heading. La hiérarchie de titres saute de `<h1>` (hero) directement à `<summary>`/`<h2 contact>` sans structure de section programmatique. Les `<details>/<summary>` natifs sont par ailleurs corrects (clavier OK, `aria-hidden` sur l'icône +).
- **Impact** : navigation par titres (lecteurs d'écran) ne reflète pas les catégories ; structure de document FAQ affaiblie.
- **Reco** : passer les libellés de catégorie en `<h2>` (et le contact en `<h2>` reste cohérent), ou utiliser `role="heading" aria-level`.
- **Confiance** : moyenne.

### [WS06-12] Hero manifeste + SVG décoratifs : gradients/hex en dur (incohérence design + dark mode) — P3
- **Fichier** : `src/app/[locale]/manifeste/page.tsx:56` (`bg-gradient-to-br from-sand-100 via-sand-300 to-clay-200`) ; SVG hex en dur dans `AboutHero.tsx:67-142`, `AboutTeam.tsx:117-169`, `AboutVisit.tsx:43-83` (`#FBF8F4`, `#807969`, `#8E5232`, etc.).
- **Catégorie** : dette / cosmétique
- **Constat** : le hero manifeste conserve un grand dégradé sand→clay — exactement le motif que la refonte home (`home-moderna`) a retiré comme « tell #1 IA ». Les SVG (bouteille hero, silhouettes équipe, carte rue) utilisent des hex codés en dur qui ne suivent pas les tokens `--c-*` → ils ne s'adaptent pas au dark mode (bandes décoratives qui s'inversent, limitation documentée du système de thèmes). `AboutStats`/`AboutCriteria`/`AboutCta` en `bg-ink-900` relèvent du même pattern « bande volontairement sombre » documenté.
- **Impact** : incohérence visuelle vs la home refondue + rendu dark-mode imparfait (lisible, documenté comme limite connue).
- **Reco** : aligner le hero manifeste sur le style éditorial sans dégradé ; à terme migrer les hex SVG vers les tokens. Faible priorité (esthétique, dark mode neuf).
- **Confiance** : moyenne (jugement de cohérence design, pas un bug fonctionnel).

### [WS06-13] Incohérence mineure `<main>` : `flex-1` vs `flex-grow` — P3
- **Fichier** : `a-propos/page.tsx:52` (`flex-1`) vs `manifeste:54` / `faq:55` / `pharmacie:58` / `livraison:47` (`flex-grow`).
- **Catégorie** : dette
- **Constat** : deux conventions pour le même rôle (faire pousser `<main>` dans le `flex-col min-h-screen`). Aucun effet visuel divergent (`flex-1` = grow+shrink+basis-0 ; `flex-grow` = grow seul ; ici équivalent en pratique).
- **Impact** : nul fonctionnellement ; cohérence du code.
- **Reco** : uniformiser (préférer `flex-1`).
- **Confiance** : haute.

## Points positifs (court)
- **Discours métier irréprochable** : toutes les mentions « consultation/diagnostic dermatologique » renvoient explicitement à la clinique partenaire Skin Laser Center (`About.partner`, `About.cta.body`, `About.hero.sub`), jamais une promesse FARMAU. La page livraison est bien click-&-collect (aucun tarif payant ; `Delivery.practical.paymentNote` = « aucun paiement en ligne »).
- **i18n complet et sain** : 271 clés du périmètre, **parité parfaite FR/ES/EN** (0 manquante), toutes les clés référencées par le code existent (clés dynamiques pillars/sections/q vérifiées), `t.rich`/`t.raw` cohérents entre langues, aucune chaîne FR codée en dur dans le JSX.
- **SEO de base correct** : `generateMetadata` + canonical + `buildLanguageAlternates` (hreflang `x-default`) sur les 5 pages ; `metadataBase` défini ; un seul `<h1>` par page.
- **Toutes les routes de liens internes existent** (catalogue/contact/faq/pharmacie/a-propos/manifeste/livraison vérifiées) — aucun 404 sur les `Link`.
- **Aucun risque XSS** : tous les `dangerouslySetInnerHTML` consomment `t.raw()` sur des clés statiques du bundle (contenu développeur), jamais de donnée utilisateur. Toutes les teintes Tailwind utilisées sont définies dans `globals.css` (pas d'élément invisible).

## Signalements hors périmètre (1 ligne chacun, max 5)
- `skin@skinlacercenter.net` (probable typo c/s + domaine tiers) est aussi codé en dur dans **6 pages légales** (`legal/mentions-legales`, `cgv`, `confidentialite`, `cookies`) et `account/security/page.tsx:112` — à corriger globalement (WS Legal / WS09).
- WS35-01 (getShopSettings avale `DynamicServerError` → FALLBACK) impacte aussi le `Footer` sur ~9 pages publiques — possédé par WS35.
- `AboutLeaveReview`/`AboutPartner` codent en dur des URL Google Maps avec lat/lng et un handle Facebook : à externaliser/confirmer (contenu).

## Zones non couvertes / à re-vérifier humainement
- **Véracité du contenu placeholder** : noms d'équipe, n° Reg. sanitaire DGM-42-2014, stats `7 farmacéuticos`/`12 ans`, horaires réels — nécessitent confirmation du commerçant (je n'ai pu vérifier que `353 références` ✓ et `60+ marques` ✗ contre la DB).
- **Comportement runtime exact des redirections de liens FAQ non préfixés** (WS06-05) sur Vercel selon cookie `NEXT_LOCALE`/Accept-Language réels — à tester en navigateur sur `/es/faq` et `/en/faq`.
- **Rendu dark mode** des bandes `bg-ink-900` et SVG hex (WS06-12) — visuellement « lisible mais inversé » selon la doc ; non vérifié en navigateur.
