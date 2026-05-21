import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LegalShell } from '@/components/legal/LegalShell'
import { LegalSection } from '@/components/legal/LegalSection'
import { Link } from '@/i18n/navigation'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'

const LAST_UPDATED_ISO = '2026-05-21'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Legal.pageMeta.cookies' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/legal/cookies'),
      languages: buildLanguageAlternates('/legal/cookies'),
    },
  }
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <LegalShell
      activeSlug="cookies"
      eyebrow="Cookies"
      title="Politique de gestion des cookies"
      lastUpdatedISO={LAST_UPDATED_ISO}
      intro="FARMAU n'utilise actuellement que des cookies essentiels au fonctionnement du site. Aucun outil de tracking publicitaire, aucun service de mesure d'audience tiers n'est actif à ce jour."
    >
      <LegalSection id="quest-ce" num="01." title="Qu'est-ce qu'un cookie ?">
        <p>
          Un cookie est un petit fichier texte déposé par un site web sur votre
          appareil (ordinateur, smartphone, tablette) lorsque vous le consultez.
          Il permet au site de mémoriser certaines informations (préférences,
          identifiant de session, langue) entre vos visites.
        </p>
        <p>
          Le terme « cookie » désigne ici, par extension, toute technologie
          équivalente : <em>localStorage</em>, <em>sessionStorage</em>, balises
          web invisibles. À l'exception de la session, FARMAU n'utilise pas de
          balises tierces.
        </p>
      </LegalSection>

      <LegalSection id="categories" num="02." title="Catégories de cookies que nous utilisons">
        <p>
          Les cookies en service sur farmau.do sont tous{' '}
          <strong>strictement nécessaires</strong> au fonctionnement du site et
          n'exigent pas de consentement préalable au titre de la Ley 172-13 RD.
          Ils sont les suivants :
        </p>
        <table>
          <thead>
            <tr>
              <th>Cookie / clé</th>
              <th>Émetteur</th>
              <th>Finalité</th>
              <th>Durée</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>sb-*-auth-token</code></td>
              <td>Supabase (sous-traitant)</td>
              <td>Authentification de l'utilisateur connecté</td>
              <td>Session + 7 jours (refresh token)</td>
            </tr>
            <tr>
              <td><code>NEXT_LOCALE</code></td>
              <td>FARMAU</td>
              <td>Mémoriser la langue sélectionnée (fr / en / es)</td>
              <td>1 an</td>
            </tr>
            <tr>
              <td><code>farmau:anonymous_id</code> (localStorage)</td>
              <td>FARMAU</td>
              <td>Lier un panier à un visiteur non connecté</td>
              <td>Persistant (effaçable depuis le navigateur)</td>
            </tr>
            <tr>
              <td><code>farmau:search:recents</code> (localStorage)</td>
              <td>FARMAU</td>
              <td>Mémoriser vos dernières recherches dans la barre ⌘K</td>
              <td>Persistant</td>
            </tr>
            <tr>
              <td><code>farmau:cookies:consent</code> (localStorage)</td>
              <td>FARMAU</td>
              <td>Mémoriser que vous avez vu le bandeau d'information</td>
              <td>12 mois</td>
            </tr>
          </tbody>
        </table>
        <p>
          <strong>Aucun cookie de mesure d'audience</strong> (Google Analytics,
          Plausible, Matomo, etc.) n'est utilisé. Si cela venait à changer, cette
          politique serait mise à jour et un consentement vous serait demandé.
        </p>
      </LegalSection>

      <LegalSection id="cookies-tiers" num="03." title="Cookies déposés par des tiers">
        <p>
          Aucun service tiers ne dépose de cookie publicitaire ou analytique sur
          le site. Les éléments tiers présents sont :
        </p>
        <ul>
          <li>
            <strong>Iframe Google Maps</strong> sur les pages Contact et À propos.
            Google peut déposer ses propres cookies lors du chargement de la
            carte. Pour bloquer ce dépôt, vous pouvez configurer votre
            navigateur en mode <em>strict</em> ou utiliser une extension de type
            uBlock Origin.
          </li>
          <li>
            <strong>Liens WhatsApp / réseaux sociaux</strong> : aucune
            interaction n'est tracée tant que vous ne cliquez pas dessus.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="gestion" num="04." title="Comment gérer les cookies">
        <p>
          Vous pouvez à tout moment effacer ou bloquer les cookies via les
          réglages de votre navigateur :
        </p>
        <ul>
          <li>
            <strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies
          </li>
          <li>
            <strong>Safari :</strong> Réglages → Confidentialité → Gérer les
            données du site web
          </li>
          <li>
            <strong>Firefox :</strong> Paramètres → Vie privée et sécurité →
            Cookies et données de sites
          </li>
          <li>
            <strong>Edge :</strong> Paramètres → Confidentialité, recherche et
            services → Effacer les données de navigation
          </li>
        </ul>
        <p>
          <strong>Attention :</strong> bloquer le cookie de session Supabase vous
          empêchera de rester connecté entre deux pages. Bloquer{' '}
          <code>farmau:anonymous_id</code> empêchera de conserver votre panier en
          tant que visiteur non connecté.
        </p>
      </LegalSection>

      <LegalSection id="dnt" num="05." title="Signal « Do Not Track »">
        <p>
          Le signal <em>Do Not Track</em> n'a aujourd'hui aucun standard
          d'application reconnu. Puisque FARMAU n'opère aucun suivi
          publicitaire ni mesure d'audience tierce, l'envoi de ce signal n'a pas
          d'effet sur votre navigation.
        </p>
      </LegalSection>

      <LegalSection id="modifications" num="06." title="Mise à jour de la politique cookies">
        <p>
          La présente politique peut être mise à jour si nous ajoutons de
          nouveaux outils (mesure d'audience, A/B testing). Dans ce cas, un
          bandeau de consentement explicite serait affiché avant tout dépôt
          non strictement nécessaire.
        </p>
        <p>
          Pour toute question :{' '}
          <a href="mailto:skin@skinlacercenter.net">skin@skinlacercenter.net</a>{' '}
          ou via la page <Link href="/contact">Contact</Link>.
        </p>
      </LegalSection>
    </LegalShell>
  )
}
