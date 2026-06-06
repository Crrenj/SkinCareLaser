#!/usr/bin/env bash
# Régénère db/schema.sql (schema public) SANS Docker.
#
# `supabase db dump` lance pg_dump DANS un conteneur Docker — KO sur cette
# machine (Docker absent/cassé). Contournement (inspiré du projet SaludRD) :
# `supabase db dump --dry-run` IMPRIME le pipeline pg_dump que le CLI lancerait
# (avec les credentials du rôle temporaire, éphémères) ; on l'exécute ensuite
# avec le pg_dump NATIF de l'hôte. Aucun mot de passe à saisir, aucun Docker.
#
# Prérequis : `supabase link` (projet lié) + pg_dump 17+ sur le PATH
#   (brew install postgresql@17). La sortie ne contient AUCUN credential.
#
# Usage : bash scripts/db-dump.sh [fichier_sortie]   (défaut : db/schema.sql)
set -euo pipefail

OUT="${1:-db/schema.sql}"
TMP_PIPE="$(mktemp -t farmau-db-dump-pipe.XXXXXX)"
TMP_SQL="$(mktemp -t farmau-db-dump-sql.XXXXXX)"
trap 'rm -f "$TMP_PIPE" "$TMP_SQL"' EXIT

# 1. Pipeline pg_dump du CLI (schema public) — NE PAS imprimer (creds éphémères).
supabase db dump --schema public --dry-run 2>/dev/null > "$TMP_PIPE"

# 2. Exécution avec le pg_dump de l'hôte (le script référence `pg_dump` nu → PATH).
bash "$TMP_PIPE" > "$TMP_SQL"

# 3. En-tête FARMAU + dump → fichier de sortie.
{
  cat <<HEADER
-- ======================================================================
-- SCHÉMA — Skincare Laser / FARMAU  ·  dump fidèle du remote (schema public)
-- ======================================================================
-- ⚠️ Source de vérité = supabase/migrations/. Ce fichier est un snapshot de
-- LECTURE régénérable (schema-only) — pratique pour voir tout le schéma d'un
-- coup. Toute modif doit aussi exister dans une migration.
--
-- Régénéré le $(date +%Y-%m-%d) via scripts/db-dump.sh (pg_dump natif de l'hôte,
-- SANS Docker — cf. en-tête du script). Re-dumper : bash scripts/db-dump.sh
-- ======================================================================

HEADER
  cat "$TMP_SQL"
} > "$OUT"

echo "Schéma dumpé dans $OUT ($(wc -l < "$OUT") lignes)"
