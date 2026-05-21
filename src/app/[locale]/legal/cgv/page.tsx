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
  const t = await getTranslations({ locale, namespace: 'Legal.pageMeta.cgv' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/legal/cgv'),
      languages: buildLanguageAlternates('/legal/cgv'),
    },
  }
}

export default async function CGVPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <LegalShell
      activeSlug="cgv"
      eyebrow="Conditions générales"
      title="Conditions générales d'utilisation et de réservation"
      lastUpdatedISO={LAST_UPDATED_ISO}
      intro="FARMAU ne vend pas en ligne : le site permet la réservation de produits dermo-cosmétiques pour collecte en pharmacie (click & collect). Le paiement s'effectue en pharmacie au moment du retrait."
    >
      <LegalSection id="objet" num="01." title="Objet du site">
        <p>
          Le site <strong>farmau.do</strong> est un service de réservation et de
          présentation de produits dermo-cosmétiques distribués par FARMAU. Il ne
          constitue pas une plateforme de vente en ligne au sens de la Ley No.
          126-02 sur le Commerce Électronique : aucune transaction financière n'est
          opérée à distance.
        </p>
        <p>
          L'utilisation du site est gratuite et ouverte à toute personne âgée d'au
          moins <strong>18 ans</strong>, à l'exclusion de toute pratique
          professionnelle de revente.
        </p>
      </LegalSection>

      <LegalSection id="compte" num="02." title="Création de compte">
        <p>
          La réservation nécessite la création d'un compte utilisateur. Lors de
          l'inscription, vous devez fournir des informations exactes, complètes et
          à jour, dont obligatoirement un numéro de téléphone valide en République
          Dominicaine ou international permettant le contact WhatsApp.
        </p>
        <p>
          Vous êtes responsable de la confidentialité de vos identifiants. Toute
          activité réalisée depuis votre compte est présumée effectuée par vous.
          En cas de soupçon d'usage non autorisé, contactez-nous immédiatement à{' '}
          <a href="mailto:skin@skinlacercenter.net">skin@skinlacercenter.net</a>.
        </p>
      </LegalSection>

      <LegalSection id="reservation" num="03." title="Réservation de produits">
        <p>
          Le processus de réservation se déroule en trois étapes :
        </p>
        <ol>
          <li>
            <strong>Constitution du panier.</strong> Vous ajoutez des produits
            depuis le catalogue ou la fiche produit.
          </li>
          <li>
            <strong>Validation de la réservation.</strong> Vous confirmez votre
            panier et vos coordonnées de contact via le bouton <em>Réserver</em>.
            Une référence de réservation au format <code>FAR-XXXXXXXX</code> vous
            est attribuée.
          </li>
          <li>
            <strong>Contact pharmacie.</strong> Un pharmacien vous contacte via
            WhatsApp pour confirmer la disponibilité et organiser le retrait en
            pharmacie.
          </li>
        </ol>
        <p>
          Une réservation est <strong>indicative</strong> et ne constitue pas un
          contrat de vente. La vente est formée uniquement au moment du retrait en
          pharmacie et du paiement effectif.
        </p>
      </LegalSection>

      <LegalSection id="duree-validite" num="04." title="Durée de validité d'une réservation">
        <p>
          Toute réservation est valable <strong>24 heures à compter de sa création</strong>.
          Passé ce délai, et sans confirmation de notre part, la réservation est
          automatiquement annulée et les produits remis en disponibilité.
        </p>
        <p>
          Un utilisateur ne peut avoir qu'<strong>une seule réservation active</strong>{' '}
          à la fois. Pour réserver d'autres produits, vous devez attendre la
          finalisation ou l'expiration de la réservation en cours.
        </p>
      </LegalSection>

      <LegalSection id="prix" num="05." title="Prix et paiement">
        <p>
          Les prix affichés sur le site sont indiqués en{' '}
          <strong>pesos dominicains (DOP)</strong>, toutes taxes comprises (ITBIS
          18 % inclus). Ils sont donnés à titre indicatif et peuvent être ajustés
          au moment du retrait pour refléter le prix en pharmacie le jour de la
          transaction.
        </p>
        <p>
          Le paiement s'effectue <strong>exclusivement en pharmacie</strong>, au
          moment du retrait des produits. Sont acceptés : espèces (DOP), cartes de
          débit et de crédit Visa/Mastercard, et tout autre moyen de paiement
          précisé en pharmacie.
        </p>
      </LegalSection>

      <LegalSection id="retrait" num="06." title="Retrait en pharmacie">
        <p>
          Le retrait s'effectue à l'adresse indiquée : Calle Jesús de Galíndez,
          esq. Calle 3, Cerros de Gurabo, Santiago, République Dominicaine, durant
          les horaires d'ouverture communiqués lors de la confirmation.
        </p>
        <p>
          Présentez votre référence de réservation et une pièce d'identité au
          moment du retrait. Un tiers peut retirer la commande à votre place en
          présentant la référence de réservation et une pièce d'identité.
        </p>
      </LegalSection>

      <LegalSection id="annulation" num="07." title="Annulation et rétractation">
        <p>
          Vous pouvez annuler une réservation à tout moment avant le retrait, sans
          frais ni motif, en répondant au message WhatsApp de confirmation ou en
          nous contactant à{' '}
          <a href="mailto:skin@skinlacercenter.net">skin@skinlacercenter.net</a>.
        </p>
        <p>
          Aucun produit cosmétique déjà retiré et payé en pharmacie ne peut faire
          l'objet d'une rétractation, conformément aux usages applicables aux
          produits d'hygiène et de soin descellés.
        </p>
      </LegalSection>

      <LegalSection id="conformite" num="08." title="Conformité et information produit">
        <p>
          Tous les produits référencés sont importés par les distributeurs agréés
          en République Dominicaine. Ils respectent les normes applicables dans
          leur pays d'origine (FDA, EMA, ANMAT, ANVISA selon les marques) ainsi
          que la réglementation dominicaine en matière de produits cosmétiques.
        </p>
        <p>
          Les fiches produits affichent à titre indicatif : composition (INCI),
          mode d'usage, contre-indications connues. Ces informations ne se
          substituent pas à un avis pharmaceutique. En cas de doute, demandez
          conseil à votre pharmacien.
        </p>
      </LegalSection>

      <LegalSection id="responsabilite" num="09." title="Responsabilité de FARMAU">
        <p>
          FARMAU s'engage à fournir un service de qualité et à donner les
          informations les plus exactes possibles. Sa responsabilité ne peut
          toutefois être engagée :
        </p>
        <ul>
          <li>en cas d'indisponibilité technique du site (maintenance, force majeure) ;</li>
          <li>en cas de rupture de stock entre la réservation et la confirmation ;</li>
          <li>en cas de mauvais usage d'un produit en dehors de ses indications ;</li>
          <li>en cas de réaction individuelle imprévisible à un composant cosmétique.</li>
        </ul>
        <p>
          La responsabilité de FARMAU est limitée au montant des produits
          effectivement payés en pharmacie.
        </p>
      </LegalSection>

      <LegalSection id="suppression-compte" num="10." title="Suspension et suppression de compte">
        <p>
          Vous pouvez demander la suppression de votre compte à tout moment en
          nous écrivant à{' '}
          <a href="mailto:skin@skinlacercenter.net">skin@skinlacercenter.net</a>.
          La suppression est effective sous 30 jours et entraîne l'effacement des
          données personnelles, sous réserve des obligations légales de
          conservation (voir la{' '}
          <Link href="/legal/confidentialite">politique de confidentialité</Link>).
        </p>
        <p>
          FARMAU se réserve le droit de suspendre ou supprimer tout compte en cas
          d'usage abusif, frauduleux ou contraire aux présentes conditions.
        </p>
      </LegalSection>

      <LegalSection id="donnees" num="11." title="Données personnelles et cookies">
        <p>
          Le traitement de vos données personnelles est détaillé dans notre{' '}
          <Link href="/legal/confidentialite">politique de confidentialité</Link>.
          L'utilisation des cookies est décrite dans la{' '}
          <Link href="/legal/cookies">politique cookies</Link>.
        </p>
      </LegalSection>

      <LegalSection id="modification" num="12." title="Modification des conditions">
        <p>
          FARMAU se réserve le droit de modifier les présentes conditions à tout
          moment. La version applicable est celle en ligne au moment de la
          création de la réservation. Les modifications substantielles vous
          seront notifiées par email ou via une notification en compte.
        </p>
      </LegalSection>

      <LegalSection id="loi-applicable" num="13." title="Loi applicable et juridiction">
        <p>
          Les présentes conditions sont régies par le droit dominicain. Tout
          litige relatif à leur interprétation ou leur exécution sera, à défaut de
          résolution amiable, soumis à la compétence exclusive des tribunaux de
          Santiago, République Dominicaine.
        </p>
      </LegalSection>
    </LegalShell>
  )
}
