# OPS — sauvegardes, quotas, supervision (G-4b, plan de remédiation 2026-06-10)

> Cadrage opérationnel pré-lancement. Les actions marquées **[ACTION PROPRIÉTAIRE]**
> dépendent d'un compte/console externe et ne peuvent pas être faites depuis le repo.

## 1. Sauvegardes / PITR

État : projet Supabase (`adxpoxcynrpnbbxnncsk`). Le niveau de sauvegarde dépend
du plan du projet — **[ACTION PROPRIÉTAIRE]** vérifier dans le dashboard Supabase
(*Database → Backups*) ce qui est actif :

- Plan gratuit : pas de sauvegardes automatiques garanties → un dump manuel
  régulier est la seule protection.
- Plan Pro : sauvegardes quotidiennes (rétention 7 j) ; le PITR (point-in-time
  recovery) est un add-on à activer si le besoin de granularité < 24 h se
  confirme après le lancement.

**Filet local disponible dès maintenant** (schéma seul) : `bash scripts/db-dump.sh`
(régénère `db/schema.sql`, versionné). Pour un dump **avec les données** (à faire
avant toute opération risquée, p. ex. le reset L-1 du lancement) :

```bash
# pg_dump complet (schéma + données) via le même contournement sans Docker :
supabase db dump --data-only --dry-run   # imprime le pipeline avec credentials éphémères
# l'exécuter avec le pg_dump natif (cf. scripts/db-dump.sh pour le pattern)
```

Recommandation : dump données hebdomadaire pendant la rampe de lancement +
**systématiquement avant** chaque migration destructive ou reset.

## 2. Quotas à surveiller

| Service | Quota concerné | Risque | Mitigation |
|---|---|---|---|
| Supabase DB | taille base + bande passante du plan | faible (catalogue ~quelques Mo) | dashboard *Usage* mensuel |
| Supabase Storage | ~300 images produit (public) | faible | re-upload = nouvelle URL, pas d'accumulation |
| Supabase Auth | MAU du plan | faible au lancement | — |
| **Resend** | plan gratuit : ~100 emails/jour, 3 000/mois | **réel** dès que l'email de confirmation de réservation (G-1) part en prod | suivre le dashboard Resend ; l'envoi est non-bloquant + no-op sans clé → une panne de quota ne casse jamais une réservation |
| Vercel | invocations/bande passante | faible (61 routes en ISR depuis la Phase 1 → la charge origin a fortement baissé) | — |

## 3. Connexions / pooling

L'app ne tient **aucune connexion Postgres directe** : tout passe par PostgREST
(REST) via `supabase-js`, et le pooling est géré par Supabase (Supavisor). Le
risque réel était le **volume de requêtes par chargement**, traité en Phase 6 :
dashboard admin **28 → 5** requêtes, valorisation d'inventaire agrégée en SQL,
catalogue public en 1 RPC (Phase 3). Aucune configuration de pool à poser côté
Vercel.

## 4. Supervision (rappel — câblée en G-4a)

- **Sentry** : SDK câblé dormant (serveur + edge + client + boundaries +
  `apiError`). **[ACTION PROPRIÉTAIRE]** créer le projet sentry.io et poser
  `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` dans Vercel.
- **Heartbeat cron** : `GET /api/health` → 503 si `expire-stale-reservations`
  n'a pas tourné depuis > 35 min. **[ACTION PROPRIÉTAIRE]** brancher un uptime
  monitor externe (UptimeRobot, Better Stack…) sur `https://farmau.do/api/health`.
- **Rate-limit** : les événements fail-open sont tracés dans les logs avec le
  marqueur `[rate-limit]` (G-5) — grep-able dans les logs Vercel.

## 5. Email (G-1)

**[ACTION PROPRIÉTAIRE — lead time externe, à lancer tôt]** : vérifier le domaine
expéditeur dans Resend (DNS SPF + DKIM pour `farmau.do`), sinon les emails de
confirmation de réservation et de newsletter partent en spam ou sont refusés.
Sans `RESEND_API_KEY` posée, tous les envois sont des no-op silencieux (aucune
casse fonctionnelle).
