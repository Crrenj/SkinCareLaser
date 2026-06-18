// Next 16 a supprimé `next lint` au profit de l'ESLint CLI (`eslint .`).
// On consomme eslint-config-next via ses entrées flat-config natives
// (`/core-web-vitals` + `/typescript`) au lieu du pont legacy
// `FlatCompat.extends("next/...")`, qui plante sous ESLint 9 + la config flat
// de Next 16 (eslint-config-next 16 ne ship plus d'entrée eslintrc).
//
// Le rule-set de BASE est inchangé (core-web-vitals + typescript). Les
// surcharges ci-dessous reproduisent À L'IDENTIQUE la posture lint de Next 15 :
//   - mêmes sévérités custom qu'avant (no-explicit-any / no-unused-vars ^_ /
//     no-unescaped-entities / exhaustive-deps en `warn`) ;
//   - on désactive la NOUVELLE famille de règles « React Compiler » qu'apporte
//     eslint-plugin-react-hooks v7 (bundlé par eslint-config-next 16) — elles
//     étaient absentes sous react-hooks v5/Next 15. Les adopter (et corriger les
//     ~46 sites de code applicatif qu'elles signalent) est un chantier délibéré
//     séparé, hors d'un simple bump de dépendance.
//
// Portée : on ignore `scripts/**` (scripts Node CommonJS, `require()` légitime)
// et `tests/**` (specs Playwright) — non scannés par le `next lint` de Next 15,
// que `eslint .` scannerait désormais.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  globalIgnores([
    "src/lib/database.types.ts",
    "scripts/**",
    "tests/**",
    // .next ET ses variantes déplacées (.next-stale-* — piège CLAUDE.md :
    // un cache déplacé DANS le repo serait sinon scanné par `eslint .`,
    // contrairement à l'ancien `next lint` limité à src/).
    ".next*/**",
    // Artefacts Playwright générés (gitignorés) : rapports HTML + bundles
    // minifiés + traces. `eslint .` les scannerait sinon (159 faux positifs sur
    // du JS minifié). Même classe de piège que .next*.
    "playwright-report/**",
    "test-results/**",
  ]),
  ...nextVitals,
  ...nextTs,
  {
    // `files` aligné sur la portée des plugins (react/react-hooks/@typescript-eslint)
    // déclarés par eslint-config-next, pour que les surcharges ci-dessous se
    // résolvent dans le même scope plugin (sinon ESLint « could not find plugin »).
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      // Permet `_unused` ou `_req` pour les paramètres intentionnellement
      // ignorés (convention TypeScript).
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      }],
      "react/no-unescaped-entities": "warn",
      "react-hooks/exhaustive-deps": "warn",
      // Famille « React Compiler » de react-hooks v7 (nouvelle en Next 16) —
      // désactivée pour conserver la posture lint de Next 15.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/globals": "off",
      "react-hooks/refs": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/set-state-in-render": "off",
      "react-hooks/unsupported-syntax": "off",
      "react-hooks/config": "off",
      "react-hooks/gating": "off",
    },
  },
]);

export default eslintConfig;
