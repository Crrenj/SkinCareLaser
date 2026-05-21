import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LegalShell } from '@/components/legal/LegalShell'
import { LegalSection } from '@/components/legal/LegalSection'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'

const LAST_UPDATED_ISO = '2026-05-21'

export const revalidate = 86400

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Legal.pageMeta.privacy' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/legal/confidentialite'),
      languages: buildLanguageAlternates('/legal/confidentialite'),
    },
  }
}

export default async function ConfidentialitePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <LegalShell
      activeSlug="confidentialite"
      eyebrow="Vie privée"
      title="Politique de confidentialité"
      lastUpdatedISO={LAST_UPDATED_ISO}
      intro="FARMAU traite des données personnelles dans le respect de la Ley No. 172-13 sur la Protection Intégrale des Données à Caractère Personnel en République Dominicaine, en s'inspirant également des standards européens (RGPD) pour les meilleures pratiques."
    >
      <LegalSection id="responsable" num="01." title="Responsable du traitement">
        <p>
          Le responsable du traitement de vos données est <strong>FARMAU SRL</strong>,
          siège social à Santiago, République Dominicaine. Pour toute question
          relative à vos données, contactez-nous à{' '}
          <a href="mailto:skin@skinlacercenter.net">skin@skinlacercenter.net</a>.
        </p>
      </LegalSection>

      <LegalSection id="donnees-collectees" num="02." title="Données que nous collectons">
        <p>Selon votre interaction avec le site, nous pouvons collecter :</p>
        <ul>
          <li>
            <strong>Données d'identification :</strong> prénom, nom, date de
            naissance (facultative), email, mot de passe (haché), numéro de
            téléphone, langue préférée.
          </li>
          <li>
            <strong>Données de navigation :</strong> identifiant de session,
            panier en cours, favoris, historique de réservations, préférences
            d'affichage.
          </li>
          <li>
            <strong>Données techniques :</strong> adresse IP (pour la sécurité et
            la limitation de débit), user-agent, date et heure des requêtes.
          </li>
          <li>
            <strong>Communications :</strong> messages envoyés via le formulaire
            de contact, inscriptions à la newsletter.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="finalites" num="03." title="Finalités du traitement">
        <p>Vos données sont traitées pour les finalités suivantes :</p>
        <table>
          <thead>
            <tr>
              <th>Finalité</th>
              <th>Base légale</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Création et gestion du compte utilisateur</td>
              <td>Exécution du contrat (CGU)</td>
            </tr>
            <tr>
              <td>Traitement des réservations et contact via WhatsApp</td>
              <td>Exécution du contrat</td>
            </tr>
            <tr>
              <td>Réponse aux messages envoyés par le formulaire de contact</td>
              <td>Intérêt légitime (suivi client)</td>
            </tr>
            <tr>
              <td>Envoi de la newsletter (si vous y êtes inscrit)</td>
              <td>Consentement, retirable à tout moment</td>
            </tr>
            <tr>
              <td>Sécurité du site (limitation de débit, prévention de fraude)</td>
              <td>Intérêt légitime</td>
            </tr>
            <tr>
              <td>Conservation des preuves comptables (réservations confirmées)</td>
              <td>Obligation légale</td>
            </tr>
          </tbody>
        </table>
      </LegalSection>

      <LegalSection id="destinataires" num="04." title="Destinataires et sous-traitants">
        <p>
          Vos données ne sont jamais vendues. Elles peuvent être partagées avec :
        </p>
        <ul>
          <li>
            <strong>Notre équipe interne</strong> (pharmaciens, support, admin)
            pour la gestion des réservations et du service client.
          </li>
          <li>
            <strong>Nos sous-traitants techniques :</strong>
            <ul>
              <li>
                <em>Supabase Inc.</em> (Singapour / États-Unis) — hébergement de
                la base de données et authentification.
              </li>
              <li>
                <em>Vercel Inc.</em> (États-Unis) — hébergement du site et
                acheminement des requêtes.
              </li>
              <li>
                <em>WhatsApp / Meta Platforms Inc.</em> — communication
                opérationnelle avec les clients ayant réservé.
              </li>
            </ul>
          </li>
          <li>
            <strong>Autorités publiques</strong> dominicaines, sur réquisition
            judiciaire ou administrative légalement formulée.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="transferts" num="05." title="Transferts internationaux">
        <p>
          L'hébergement chez Vercel et Supabase peut entraîner un transfert de
          données hors de la République Dominicaine, principalement vers les
          États-Unis et Singapour. Ces sous-traitants présentent des garanties
          contractuelles de sécurité conformes à leurs propres standards (SOC 2,
          ISO 27001).
        </p>
      </LegalSection>

      <LegalSection id="duree" num="06." title="Durée de conservation">
        <table>
          <thead>
            <tr>
              <th>Catégorie</th>
              <th>Durée de conservation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Compte utilisateur actif</td>
              <td>Tant que le compte est actif</td>
            </tr>
            <tr>
              <td>Compte inactif</td>
              <td>3 ans à compter de la dernière connexion, puis suppression</td>
            </tr>
            <tr>
              <td>Réservations confirmées (justificatifs)</td>
              <td>5 ans (obligation comptable)</td>
            </tr>
            <tr>
              <td>Messages du formulaire de contact</td>
              <td>2 ans</td>
            </tr>
            <tr>
              <td>Inscription newsletter</td>
              <td>Jusqu'au désabonnement</td>
            </tr>
            <tr>
              <td>Logs techniques et IP</td>
              <td>6 mois</td>
            </tr>
          </tbody>
        </table>
      </LegalSection>

      <LegalSection id="droits" num="07." title="Vos droits">
        <p>
          Conformément à la Ley 172-13, vous disposez des droits suivants sur vos
          données :
        </p>
        <ul>
          <li><strong>Droit d'accès</strong> aux données vous concernant ;</li>
          <li><strong>Droit de rectification</strong> des données inexactes ou incomplètes ;</li>
          <li><strong>Droit de suppression</strong> (« droit à l'oubli »), sous réserve des obligations légales de conservation ;</li>
          <li><strong>Droit d'opposition</strong> au traitement de vos données pour des motifs légitimes ;</li>
          <li><strong>Droit à la portabilité</strong> : récupérer vos données dans un format structuré, couramment utilisé ;</li>
          <li><strong>Droit de retirer votre consentement</strong> à tout moment (notamment pour la newsletter).</li>
        </ul>
        <p>
          Pour exercer ces droits, écrivez-nous à{' '}
          <a href="mailto:skin@skinlacercenter.net">skin@skinlacercenter.net</a>{' '}
          en précisant votre demande et une preuve d'identité. Une réponse vous
          sera apportée dans un délai maximum de 30 jours.
        </p>
        <p>
          En cas de désaccord persistant, vous pouvez introduire une réclamation
          auprès de l'autorité dominicaine compétente.
        </p>
      </LegalSection>

      <LegalSection id="securite" num="08." title="Sécurité des données">
        <p>
          FARMAU met en œuvre des mesures techniques et organisationnelles
          appropriées pour protéger vos données contre la perte, l'accès non
          autorisé, la divulgation, l'altération ou la destruction :
        </p>
        <ul>
          <li>chiffrement TLS sur l'ensemble des échanges ;</li>
          <li>hachage des mots de passe (Argon2 / bcrypt) ;</li>
          <li>contrôle d'accès par rôle (RLS PostgreSQL au niveau de la base) ;</li>
          <li>limitation de débit sur les routes sensibles ;</li>
          <li>audits de sécurité périodiques.</li>
        </ul>
        <p>
          Aucune méthode de transmission ou de stockage n'est totalement
          inviolable. En cas de violation de données affectant vos droits, nous
          vous en informerons dans un délai de 72 heures.
        </p>
      </LegalSection>

      <LegalSection id="enfants" num="09." title="Protection des mineurs">
        <p>
          Le site et le service de réservation ne s'adressent pas aux personnes
          de moins de 18 ans. Nous ne collectons pas sciemment de données
          relatives à des mineurs. Si vous constatez qu'un mineur a créé un
          compte, contactez-nous pour suppression.
        </p>
      </LegalSection>

      <LegalSection id="modifications" num="10." title="Modifications de la politique">
        <p>
          La présente politique peut évoluer pour refléter des changements
          légaux, techniques ou organisationnels. La date en haut de page
          indique la dernière mise à jour. En cas de modification substantielle,
          vous serez informé par email ou notification en compte.
        </p>
      </LegalSection>

      <LegalSection id="contact-dpo" num="11." title="Contact référent données">
        <p>
          Pour toute question relative à la présente politique ou à vos
          données :
        </p>
        <ul>
          <li>
            <strong>Email :</strong>{' '}
            <a href="mailto:skin@skinlacercenter.net">skin@skinlacercenter.net</a>
          </li>
          <li>
            <strong>Courrier :</strong> FARMAU — Référent données, Calle Jesús de
            Galíndez, esq. Calle 3, Cerros de Gurabo, Santiago, République
            Dominicaine.
          </li>
        </ul>
      </LegalSection>
    </LegalShell>
  )
}
