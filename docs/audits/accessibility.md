# Audit Accessibilité (WCAG 2.1 AA)

Dernière mise à jour : 2026-05-26

## Synthèse

**Note : B+ (~78% WCAG 2.1 AA) — amélioration majeure depuis 38/100**

Le site a progressé de 38/100 à ~78/100 grâce à des corrections systématiques : focus-visible global, modales conformes, lang dynamique, skip link, et migration des 35 `alert()` vers `sonner` toasts.

### Conformité par dimension

| Dimension | Score | Statut |
|---|---|---|
| Semantic HTML | 85% | ✅ Conforme |
| ARIA | 80% | ✅ Conforme |
| Navigation clavier / focus | 75% | ⚠️ Partiel (drawers) |
| Focus management modal | 85% | ✅ Conforme (hook useModalA11y) |
| Contraste couleurs | 75% | ⚠️ Borderline sur `ink-400` |
| Alt text images | 90% | ✅ Conforme |
| Forms (labels + erreurs) | 70% | ⚠️ Manque `aria-invalid` |
| Loading states (live regions) | 60% | ⚠️ Newsletter non annoncé |
| Skip link | 100% | ✅ Présent |
| Langue du document | 100% | ✅ `<html lang={locale}>` dynamique |

## Findings

### ~~1. `<html lang="en">` erroné~~ ✅ FERMÉ
`<html lang={locale}>` dynamique via `getLocale()` next-intl.

### ~~2. `focus:outline-none` sans alternative~~ ✅ FERMÉ
67 instances de `focus-visible` partout. **0 `focus:outline-none`** restant.

### ~~3. Modales sans `role="dialog"`~~ ✅ FERMÉ
18 modales avec `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
Hook `useModalA11y` : focus trap, Escape, scroll lock, focus restore.

### ~~4. Skip link absent~~ ✅ FERMÉ
"Aller au contenu principal" sur toutes les pages publiques.

### ~~5. `alert()` natifs (35)~~ ✅ QUASI-FERMÉ
31 `toast()` via sonner. **3 `alert()` restants** :
- `UsersClient.tsx:67` — auto-demote guard
- `UsersClient.tsx:69` — update failed
- `NewsletterClient.tsx:57` — delete failed
**Recommandation** : migrer ces 3 vers `toast.error()`.

### ~~6. `confirm()` natifs~~ ✅ FERMÉ
`useConfirmDialog` hook + `ConfirmDialog` composant. Design system unifié.

### ~~7. ProductCard `<button>` dans `<a>`~~ ✅ FERMÉ
Refonte stretched-link pattern. HTML valide.

### 8. Focus trap manquant sur drawers — ❌ OUVERT (High)
`CartDrawer` et `MobileDrawer` utilisent un listener Escape manuel mais **pas de focus trap**.
L'utilisateur clavier peut Tab en dehors du drawer vers la page derrière.
**Recommandation** : réutiliser `useModalA11y` sur ces 2 drawers.

### 9. `aria-invalid` manquant sur les forms — ❌ OUVERT (Medium)
Les inputs en erreur ne posent pas `aria-invalid="true"` ni `aria-describedby` vers le message d'erreur.
Concerne : login, signup, reset-password, contact.
**Recommandation** : lier chaque input à son message d'erreur.

### 10. Newsletter success/error non annoncé — ❌ OUVERT (Medium)
Les messages de succès/erreur du formulaire newsletter (`FooterNewsletter`) ne sont pas dans une `aria-live` region.
**Recommandation** : wraper le message dans `aria-live="polite"`.

### 11. Contraste `ink-400` borderline — ❌ OUVERT (Low)
| Combinaison | Ratio | Grade |
|---|---|---|
| `clay-700` sur `sand-50` | 6.2:1 | ✅ AA |
| `ink-900` sur `sand-50` | 14.5:1 | ✅ AAA |
| `ink-700` sur `sand-100` | 6.8:1 | ✅ AA |
| `ink-500` sur `sand-50` | 5.5:1 | ⚠️ Borderline AA |
| **`ink-400`** sur `sand-50` | **3.8:1** | ❌ **Fail AA** |

**Recommandation** : remplacer `text-ink-400` par `text-ink-500` sur fonds clairs.

### ~~12-18. Autres findings initiaux~~ ✅ FERMÉS
`prefers-reduced-motion` respecté, labels corrects, alt text images, etc.

## Inventaire modales/drawers

| Composant | role=dialog | Focus trap | Escape | aria-label |
|---|---|---|---|---|
| ConfirmDialog | ✅ | ✅ useModalA11y | ✅ | ✅ |
| ProductFormModal | ✅ | ✅ useModalA11y | ✅ | ✅ |
| BrandFormModal | ✅ | ✅ useModalA11y | ✅ | ✅ |
| TagModal | ✅ | ✅ useModalA11y | ✅ | ✅ |
| BannerFormModal | ✅ | ✅ useModalA11y | ✅ | ✅ |
| ReservationDrawer | ✅ | ✅ useModalA11y | ✅ | ✅ |
| CartDrawer | ✅ | ❌ Manuel | ✅ | ✅ |
| MobileDrawer | ✅ | ❌ Manuel | ✅ | ✅ |
| CookieBanner | ✅ | ⚠️ | ✅ | ✅ |

## Recommandations

1. **(High)** Ajouter focus trap sur CartDrawer + MobileDrawer (réutiliser useModalA11y)
2. **(Medium)** Ajouter `aria-invalid` + `aria-describedby` sur les inputs de formulaire en erreur
3. **(Medium)** Wrapper messages newsletter dans `aria-live="polite"`
4. **(Low)** Remplacer `text-ink-400` par `text-ink-500` sur fonds clairs
5. **(Low)** Migrer les 3 derniers `alert()` vers `toast.error()`
