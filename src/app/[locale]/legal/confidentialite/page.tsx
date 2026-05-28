import type { Metadata } from 'next'
import type { ReactNode } from 'react'
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

// Contenu légal versionné par locale. NB : le corps des pages /legal/* reste
// hors du namespace de messages i18n (rich-text long-form) — exception assumée.
// FR = référence ; ES = traduction de travail à FAIRE VALIDER par un juriste RD.
// `en` retombe sur FR tant qu'une version anglaise n'est pas fournie.
type LegalContent = {
  eyebrow: string
  title: string
  intro: string
  sections: ReactNode
}

const CONTENT: Record<string, LegalContent> = {
  fr: {
    eyebrow: 'Vie privée',
    title: 'Politique de confidentialité',
    intro:
      "FARMAU traite des données personnelles dans le respect de la Ley No. 172-13 sur la Protection Intégrale des Données à Caractère Personnel en République Dominicaine, en s'inspirant également des standards européens (RGPD) pour les meilleures pratiques.",
    sections: (
      <>
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
              <strong>Données d&apos;identification :</strong> prénom, nom, date de
              naissance (facultative), email, mot de passe (haché), numéro de
              téléphone, langue préférée.
            </li>
            <li>
              <strong>Données de navigation :</strong> identifiant de session,
              panier en cours, favoris, historique de réservations, préférences
              d&apos;affichage.
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
          <p>Vos données ne sont jamais vendues. Elles peuvent être partagées avec :</p>
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
            L&apos;hébergement chez Vercel et Supabase peut entraîner un transfert de
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
                <td>Jusqu&apos;au désabonnement</td>
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
            <li><strong>Droit d&apos;accès</strong> aux données vous concernant ;</li>
            <li><strong>Droit de rectification</strong> des données inexactes ou incomplètes ;</li>
            <li><strong>Droit de suppression</strong> (« droit à l&apos;oubli »), sous réserve des obligations légales de conservation ;</li>
            <li><strong>Droit d&apos;opposition</strong> au traitement de vos données pour des motifs légitimes ;</li>
            <li><strong>Droit à la portabilité</strong> : récupérer vos données dans un format structuré, couramment utilisé ;</li>
            <li><strong>Droit de retirer votre consentement</strong> à tout moment (notamment pour la newsletter).</li>
          </ul>
          <p>
            Pour exercer ces droits, écrivez-nous à{' '}
            <a href="mailto:skin@skinlacercenter.net">skin@skinlacercenter.net</a>{' '}
            en précisant votre demande et une preuve d&apos;identité. Une réponse vous
            sera apportée dans un délai maximum de 30 jours.
          </p>
          <p>
            En cas de désaccord persistant, vous pouvez introduire une réclamation
            auprès de l&apos;autorité dominicaine compétente.
          </p>
        </LegalSection>

        <LegalSection id="securite" num="08." title="Sécurité des données">
          <p>
            FARMAU met en œuvre des mesures techniques et organisationnelles
            appropriées pour protéger vos données contre la perte, l&apos;accès non
            autorisé, la divulgation, l&apos;altération ou la destruction :
          </p>
          <ul>
            <li>chiffrement TLS sur l&apos;ensemble des échanges ;</li>
            <li>hachage des mots de passe (Argon2 / bcrypt) ;</li>
            <li>contrôle d&apos;accès par rôle (RLS PostgreSQL au niveau de la base) ;</li>
            <li>limitation de débit sur les routes sensibles ;</li>
            <li>audits de sécurité périodiques.</li>
          </ul>
          <p>
            Aucune méthode de transmission ou de stockage n&apos;est totalement
            inviolable. En cas de violation de données affectant vos droits, nous
            vous en informerons dans un délai de 72 heures.
          </p>
        </LegalSection>

        <LegalSection id="enfants" num="09." title="Protection des mineurs">
          <p>
            Le site et le service de réservation ne s&apos;adressent pas aux personnes
            de moins de 18 ans. Nous ne collectons pas sciemment de données
            relatives à des mineurs. Si vous constatez qu&apos;un mineur a créé un
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
          <p>Pour toute question relative à la présente politique ou à vos données :</p>
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
      </>
    ),
  },

  es: {
    eyebrow: 'Privacidad',
    title: 'Política de privacidad',
    intro:
      'FARMAU trata los datos personales conforme a la Ley No. 172-13 sobre Protección Integral de Datos Personales en República Dominicana, inspirándose además en los estándares europeos (RGPD) como mejores prácticas.',
    sections: (
      <>
        <LegalSection id="responsable" num="01." title="Responsable del tratamiento">
          <p>
            El responsable del tratamiento de sus datos es <strong>FARMAU SRL</strong>,
            con domicilio social en Santiago, República Dominicana. Para cualquier
            consulta relativa a sus datos, contáctenos en{' '}
            <a href="mailto:skin@skinlacercenter.net">skin@skinlacercenter.net</a>.
          </p>
        </LegalSection>

        <LegalSection id="donnees-collectees" num="02." title="Datos que recopilamos">
          <p>Según su interacción con el sitio, podemos recopilar:</p>
          <ul>
            <li>
              <strong>Datos de identificación:</strong> nombre, apellidos, fecha de
              nacimiento (opcional), correo electrónico, contraseña (cifrada),
              número de teléfono, idioma preferido.
            </li>
            <li>
              <strong>Datos de navegación:</strong> identificador de sesión, carrito
              en curso, favoritos, historial de reservas, preferencias de
              visualización.
            </li>
            <li>
              <strong>Datos técnicos:</strong> dirección IP (para la seguridad y la
              limitación de peticiones), agente de usuario, fecha y hora de las
              solicitudes.
            </li>
            <li>
              <strong>Comunicaciones:</strong> mensajes enviados mediante el
              formulario de contacto, suscripciones al boletín.
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="finalites" num="03." title="Finalidades del tratamiento">
          <p>Sus datos se tratan para las siguientes finalidades:</p>
          <table>
            <thead>
              <tr>
                <th>Finalidad</th>
                <th>Base legal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Creación y gestión de la cuenta de usuario</td>
                <td>Ejecución del contrato (Condiciones de uso)</td>
              </tr>
              <tr>
                <td>Tramitación de las reservas y contacto por WhatsApp</td>
                <td>Ejecución del contrato</td>
              </tr>
              <tr>
                <td>Respuesta a los mensajes enviados por el formulario de contacto</td>
                <td>Interés legítimo (seguimiento del cliente)</td>
              </tr>
              <tr>
                <td>Envío del boletín (si está suscrito)</td>
                <td>Consentimiento, revocable en cualquier momento</td>
              </tr>
              <tr>
                <td>Seguridad del sitio (limitación de peticiones, prevención de fraude)</td>
                <td>Interés legítimo</td>
              </tr>
              <tr>
                <td>Conservación de justificantes contables (reservas confirmadas)</td>
                <td>Obligación legal</td>
              </tr>
            </tbody>
          </table>
        </LegalSection>

        <LegalSection id="destinataires" num="04." title="Destinatarios y encargados del tratamiento">
          <p>Sus datos nunca se venden. Pueden compartirse con:</p>
          <ul>
            <li>
              <strong>Nuestro equipo interno</strong> (farmacéuticos, soporte,
              administración) para la gestión de las reservas y la atención al
              cliente.
            </li>
            <li>
              <strong>Nuestros encargados técnicos:</strong>
              <ul>
                <li>
                  <em>Supabase Inc.</em> (Singapur / Estados Unidos) — alojamiento de
                  la base de datos y autenticación.
                </li>
                <li>
                  <em>Vercel Inc.</em> (Estados Unidos) — alojamiento del sitio y
                  enrutamiento de las peticiones.
                </li>
                <li>
                  <em>WhatsApp / Meta Platforms Inc.</em> — comunicación operativa
                  con los clientes que han reservado.
                </li>
              </ul>
            </li>
            <li>
              <strong>Autoridades públicas</strong> dominicanas, mediante
              requerimiento judicial o administrativo legalmente formulado.
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="transferts" num="05." title="Transferencias internacionales">
          <p>
            El alojamiento en Vercel y Supabase puede implicar una transferencia de
            datos fuera de la República Dominicana, principalmente hacia Estados
            Unidos y Singapur. Estos encargados ofrecen garantías contractuales de
            seguridad conformes a sus propios estándares (SOC 2, ISO 27001).
          </p>
        </LegalSection>

        <LegalSection id="duree" num="06." title="Plazo de conservación">
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Plazo de conservación</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cuenta de usuario activa</td>
                <td>Mientras la cuenta esté activa</td>
              </tr>
              <tr>
                <td>Cuenta inactiva</td>
                <td>3 años desde la última conexión, luego eliminación</td>
              </tr>
              <tr>
                <td>Reservas confirmadas (justificantes)</td>
                <td>5 años (obligación contable)</td>
              </tr>
              <tr>
                <td>Mensajes del formulario de contacto</td>
                <td>2 años</td>
              </tr>
              <tr>
                <td>Suscripción al boletín</td>
                <td>Hasta la baja</td>
              </tr>
              <tr>
                <td>Registros técnicos e IP</td>
                <td>6 meses</td>
              </tr>
            </tbody>
          </table>
        </LegalSection>

        <LegalSection id="droits" num="07." title="Sus derechos">
          <p>
            Conforme a la Ley 172-13, usted dispone de los siguientes derechos sobre
            sus datos:
          </p>
          <ul>
            <li><strong>Derecho de acceso</strong> a los datos que le conciernen;</li>
            <li><strong>Derecho de rectificación</strong> de los datos inexactos o incompletos;</li>
            <li><strong>Derecho de supresión</strong> (« derecho al olvido »), sin perjuicio de las obligaciones legales de conservación;</li>
            <li><strong>Derecho de oposición</strong> al tratamiento de sus datos por motivos legítimos;</li>
            <li><strong>Derecho a la portabilidad</strong>: recuperar sus datos en un formato estructurado y de uso común;</li>
            <li><strong>Derecho a retirar su consentimiento</strong> en cualquier momento (en particular para el boletín).</li>
          </ul>
          <p>
            Para ejercer estos derechos, escríbanos a{' '}
            <a href="mailto:skin@skinlacercenter.net">skin@skinlacercenter.net</a>{' '}
            indicando su solicitud y una prueba de identidad. Le responderemos en un
            plazo máximo de 30 días.
          </p>
          <p>
            En caso de desacuerdo persistente, puede presentar una reclamación ante
            la autoridad dominicana competente.
          </p>
        </LegalSection>

        <LegalSection id="securite" num="08." title="Seguridad de los datos">
          <p>
            FARMAU aplica medidas técnicas y organizativas apropiadas para proteger
            sus datos frente a la pérdida, el acceso no autorizado, la divulgación,
            la alteración o la destrucción:
          </p>
          <ul>
            <li>cifrado TLS en todos los intercambios;</li>
            <li>hash de las contraseñas (Argon2 / bcrypt);</li>
            <li>control de acceso por rol (RLS de PostgreSQL a nivel de base de datos);</li>
            <li>limitación de peticiones en las rutas sensibles;</li>
            <li>auditorías de seguridad periódicas.</li>
          </ul>
          <p>
            Ningún método de transmisión o almacenamiento es totalmente inviolable.
            En caso de violación de datos que afecte a sus derechos, le
            informaremos en un plazo de 72 horas.
          </p>
        </LegalSection>

        <LegalSection id="enfants" num="09." title="Protección de los menores">
          <p>
            El sitio y el servicio de reserva no están dirigidos a menores de 18
            años. No recopilamos a sabiendas datos relativos a menores. Si detecta
            que un menor ha creado una cuenta, contáctenos para su eliminación.
          </p>
        </LegalSection>

        <LegalSection id="modifications" num="10." title="Modificaciones de la política">
          <p>
            La presente política puede evolucionar para reflejar cambios legales,
            técnicos u organizativos. La fecha en la parte superior de la página
            indica la última actualización. En caso de modificación sustancial,
            será informado por correo electrónico o notificación en la cuenta.
          </p>
        </LegalSection>

        <LegalSection id="contact-dpo" num="11." title="Contacto referente de datos">
          <p>Para cualquier consulta relativa a la presente política o a sus datos:</p>
          <ul>
            <li>
              <strong>Correo electrónico:</strong>{' '}
              <a href="mailto:skin@skinlacercenter.net">skin@skinlacercenter.net</a>
            </li>
            <li>
              <strong>Correo postal:</strong> FARMAU — Referente de datos, Calle
              Jesús de Galíndez, esq. Calle 3, Cerros de Gurabo, Santiago, República
              Dominicana.
            </li>
          </ul>
        </LegalSection>
      </>
    ),
  },
}

export default async function ConfidentialitePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const c = CONTENT[locale] ?? CONTENT.fr

  return (
    <LegalShell
      activeSlug="confidentialite"
      eyebrow={c.eyebrow}
      title={c.title}
      lastUpdatedISO={LAST_UPDATED_ISO}
      intro={c.intro}
    >
      {c.sections}
    </LegalShell>
  )
}
