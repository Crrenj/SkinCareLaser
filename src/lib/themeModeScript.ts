/**
 * Script anti-flash du thème, injecté inline dans <head> (src/app/layout.tsx)
 * AVANT le premier paint pour résoudre `data-mode`.
 *
 * Extrait dans ce module pour être partagé entre :
 *   - le layout (qui l'injecte via dangerouslySetInnerHTML)
 *   - next.config.ts (qui calcule son hash SHA-256 pour la CSP `script-src`)
 * → le hash reste TOUJOURS synchrone avec le script (zéro drift), ce qui
 * permet de retirer `'unsafe-inline'` de la CSP tout en gardant le SSG.
 *
 * Ne contient QUE une constante string (aucune dépendance) → importable
 * aussi bien côté serveur que depuis next.config.ts.
 */
export const THEME_MODE_SCRIPT = `(function(){try{var d=document.documentElement;var a=d.getAttribute('data-allow-mode')==='1';var def=d.getAttribute('data-default-mode')||'light';var s=null;try{if(a){s=localStorage.getItem('farmau:mode');}}catch(e){}var m=s||def;if(m==='system'){m=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}if(m!=='dark'&&m!=='light'){m='light';}d.setAttribute('data-mode',m);}catch(e){}})();`
