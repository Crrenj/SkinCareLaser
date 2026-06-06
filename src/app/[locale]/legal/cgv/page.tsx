import type { Metadata } from 'next'
import type { ReactNode } from 'react'
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

// Contenu légal versionné par locale. NB : le corps des pages /legal/* reste
// hors du namespace de messages i18n (rich-text long-form) — c'est l'exception
// assumée du projet. FR = référence ; ES = traduction de travail à FAIRE VALIDER
// par un juriste RD. `en` retombe sur FR tant qu'une version anglaise n'est pas
// fournie.
type LegalContent = {
  eyebrow: string
  title: string
  intro: string
  sections: ReactNode
}

const CONTENT: Record<string, LegalContent> = {
  fr: {
    eyebrow: 'Conditions générales',
    title: "Conditions générales d'utilisation et de réservation",
    intro:
      "FARMAU ne vend pas en ligne : le site permet la réservation de produits dermo-cosmétiques pour collecte en pharmacie (click & collect). Le paiement s'effectue en pharmacie au moment du retrait.",
    sections: (
      <>
        <LegalSection id="objet" num="01." title="Objet du site">
          <p>
            Le site <strong>farmau.do</strong> est un service de réservation et de
            présentation de produits dermo-cosmétiques distribués par FARMAU. Il ne
            constitue pas une plateforme de vente en ligne au sens de la Ley No.
            126-02 sur le Commerce Électronique : aucune transaction financière n&apos;est
            opérée à distance.
          </p>
          <p>
            L&apos;utilisation du site est gratuite et ouverte à toute personne âgée d&apos;au
            moins <strong>18 ans</strong>, à l&apos;exclusion de toute pratique
            professionnelle de revente.
          </p>
        </LegalSection>

        <LegalSection id="compte" num="02." title="Création de compte">
          <p>
            La réservation nécessite la création d&apos;un compte utilisateur. Lors de
            l&apos;inscription, vous devez fournir des informations exactes, complètes et
            à jour, dont obligatoirement un numéro de téléphone valide en République
            Dominicaine ou international permettant le contact WhatsApp.
          </p>
          <p>
            Vous êtes responsable de la confidentialité de vos identifiants. Toute
            activité réalisée depuis votre compte est présumée effectuée par vous.
            En cas de soupçon d&apos;usage non autorisé, contactez-nous immédiatement à{' '}
            <a href="mailto:contact@farmau.do">contact@farmau.do</a>.
          </p>
        </LegalSection>

        <LegalSection id="reservation" num="03." title="Réservation de produits">
          <p>Le processus de réservation se déroule en trois étapes :</p>
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
            Un utilisateur ne peut avoir qu&apos;<strong>une seule réservation active</strong>{' '}
            à la fois. Pour réserver d&apos;autres produits, vous devez attendre la
            finalisation ou l&apos;expiration de la réservation en cours.
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
            Le paiement s&apos;effectue <strong>exclusivement en pharmacie</strong>, au
            moment du retrait des produits. Sont acceptés : espèces (DOP), cartes de
            débit et de crédit Visa/Mastercard, et tout autre moyen de paiement
            précisé en pharmacie.
          </p>
        </LegalSection>

        <LegalSection id="retrait" num="06." title="Retrait en pharmacie">
          <p>
            Le retrait s&apos;effectue à l&apos;adresse indiquée : Calle Jesús de Galíndez,
            esq. Calle 3, Cerros de Gurabo, Santiago, République Dominicaine, durant
            les horaires d&apos;ouverture communiqués lors de la confirmation.
          </p>
          <p>
            Présentez votre référence de réservation et une pièce d&apos;identité au
            moment du retrait. Un tiers peut retirer la commande à votre place en
            présentant la référence de réservation et une pièce d&apos;identité.
          </p>
        </LegalSection>

        <LegalSection id="annulation" num="07." title="Annulation et rétractation">
          <p>
            Vous pouvez annuler une réservation à tout moment avant le retrait, sans
            frais ni motif, en répondant au message WhatsApp de confirmation ou en
            nous contactant à{' '}
            <a href="mailto:contact@farmau.do">contact@farmau.do</a>.
          </p>
          <p>
            Aucun produit cosmétique déjà retiré et payé en pharmacie ne peut faire
            l&apos;objet d&apos;une rétractation, conformément aux usages applicables aux
            produits d&apos;hygiène et de soin descellés.
          </p>
        </LegalSection>

        <LegalSection id="conformite" num="08." title="Conformité et information produit">
          <p>
            Tous les produits référencés sont importés par les distributeurs agréés
            en République Dominicaine. Ils respectent les normes applicables dans
            leur pays d&apos;origine (FDA, EMA, ANMAT, ANVISA selon les marques) ainsi
            que la réglementation dominicaine en matière de produits cosmétiques.
          </p>
          <p>
            Les fiches produits affichent à titre indicatif : composition (INCI),
            mode d&apos;usage, contre-indications connues. Ces informations ne se
            substituent pas à un avis pharmaceutique. En cas de doute, demandez
            conseil à votre pharmacien.
          </p>
        </LegalSection>

        <LegalSection id="responsabilite" num="09." title="Responsabilité de FARMAU">
          <p>
            FARMAU s&apos;engage à fournir un service de qualité et à donner les
            informations les plus exactes possibles. Sa responsabilité ne peut
            toutefois être engagée :
          </p>
          <ul>
            <li>en cas d&apos;indisponibilité technique du site (maintenance, force majeure) ;</li>
            <li>en cas de rupture de stock entre la réservation et la confirmation ;</li>
            <li>en cas de mauvais usage d&apos;un produit en dehors de ses indications ;</li>
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
            <a href="mailto:contact@farmau.do">contact@farmau.do</a>.
            La suppression est effective sous 30 jours et entraîne l&apos;effacement des
            données personnelles, sous réserve des obligations légales de
            conservation (voir la{' '}
            <Link href="/legal/confidentialite">politique de confidentialité</Link>).
          </p>
          <p>
            FARMAU se réserve le droit de suspendre ou supprimer tout compte en cas
            d&apos;usage abusif, frauduleux ou contraire aux présentes conditions.
          </p>
        </LegalSection>

        <LegalSection id="donnees" num="11." title="Données personnelles et cookies">
          <p>
            Le traitement de vos données personnelles est détaillé dans notre{' '}
            <Link href="/legal/confidentialite">politique de confidentialité</Link>.
            L&apos;utilisation des cookies est décrite dans la{' '}
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
      </>
    ),
  },

  es: {
    eyebrow: 'Condiciones generales',
    title: 'Condiciones generales de uso y de reserva',
    intro:
      'FARMAU no vende en línea: el sitio permite reservar productos dermocosméticos para retirarlos en farmacia (click & collect). El pago se realiza en la farmacia en el momento de la recogida.',
    sections: (
      <>
        <LegalSection id="objet" num="01." title="Objeto del sitio">
          <p>
            El sitio <strong>farmau.do</strong> es un servicio de reserva y
            presentación de productos dermocosméticos distribuidos por FARMAU. No
            constituye una plataforma de venta en línea en el sentido de la Ley No.
            126-02 sobre Comercio Electrónico: no se realiza ninguna transacción
            financiera a distancia.
          </p>
          <p>
            El uso del sitio es gratuito y está abierto a toda persona mayor de{' '}
            <strong>18 años</strong>, con exclusión de cualquier práctica
            profesional de reventa.
          </p>
        </LegalSection>

        <LegalSection id="compte" num="02." title="Creación de cuenta">
          <p>
            La reserva requiere la creación de una cuenta de usuario. Al
            registrarse, debe proporcionar información exacta, completa y
            actualizada, incluyendo obligatoriamente un número de teléfono válido en
            República Dominicana o internacional que permita el contacto por
            WhatsApp.
          </p>
          <p>
            Usted es responsable de la confidencialidad de sus credenciales. Toda
            actividad realizada desde su cuenta se presume efectuada por usted. En
            caso de sospecha de uso no autorizado, contáctenos de inmediato en{' '}
            <a href="mailto:contact@farmau.do">contact@farmau.do</a>.
          </p>
        </LegalSection>

        <LegalSection id="reservation" num="03." title="Reserva de productos">
          <p>El proceso de reserva se desarrolla en tres etapas:</p>
          <ol>
            <li>
              <strong>Composición del carrito.</strong> Usted añade productos desde
              el catálogo o la ficha de producto.
            </li>
            <li>
              <strong>Validación de la reserva.</strong> Usted confirma su carrito y
              sus datos de contacto mediante el botón <em>Reservar</em>. Se le
              asigna una referencia de reserva con el formato{' '}
              <code>FAR-XXXXXXXX</code>.
            </li>
            <li>
              <strong>Contacto con la farmacia.</strong> Un farmacéutico le contacta
              por WhatsApp para confirmar la disponibilidad y organizar la recogida
              en la farmacia.
            </li>
          </ol>
          <p>
            Una reserva es <strong>indicativa</strong> y no constituye un contrato
            de venta. La venta se perfecciona únicamente en el momento de la
            recogida en la farmacia y del pago efectivo.
          </p>
        </LegalSection>

        <LegalSection id="duree-validite" num="04." title="Vigencia de una reserva">
          <p>
            Toda reserva es válida durante{' '}
            <strong>24 horas a partir de su creación</strong>. Transcurrido ese
            plazo, y sin confirmación por nuestra parte, la reserva se cancela
            automáticamente y los productos vuelven a estar disponibles.
          </p>
          <p>
            Un usuario solo puede tener{' '}
            <strong>una única reserva activa</strong> a la vez. Para reservar otros
            productos, debe esperar la finalización o la expiración de la reserva en
            curso.
          </p>
        </LegalSection>

        <LegalSection id="prix" num="05." title="Precios y pago">
          <p>
            Los precios mostrados en el sitio se indican en{' '}
            <strong>pesos dominicanos (DOP)</strong>, con todos los impuestos
            incluidos (ITBIS 18 % incluido). Se ofrecen a título indicativo y pueden
            ajustarse en el momento de la recogida para reflejar el precio en la
            farmacia el día de la transacción.
          </p>
          <p>
            El pago se realiza <strong>exclusivamente en la farmacia</strong>, en el
            momento de la recogida de los productos. Se aceptan: efectivo (DOP),
            tarjetas de débito y crédito Visa/Mastercard, y cualquier otro medio de
            pago indicado en la farmacia.
          </p>
        </LegalSection>

        <LegalSection id="retrait" num="06." title="Recogida en farmacia">
          <p>
            La recogida se efectúa en la dirección indicada: Calle Jesús de
            Galíndez, esq. Calle 3, Cerros de Gurabo, Santiago, República
            Dominicana, durante el horario de apertura comunicado al confirmar la
            reserva.
          </p>
          <p>
            Presente su referencia de reserva y un documento de identidad en el
            momento de la recogida. Un tercero puede recoger el pedido en su lugar
            presentando la referencia de reserva y un documento de identidad.
          </p>
        </LegalSection>

        <LegalSection id="annulation" num="07." title="Cancelación y desistimiento">
          <p>
            Puede cancelar una reserva en cualquier momento antes de la recogida,
            sin gastos ni motivo, respondiendo al mensaje de confirmación de
            WhatsApp o contactándonos en{' '}
            <a href="mailto:contact@farmau.do">contact@farmau.do</a>.
          </p>
          <p>
            Ningún producto cosmético ya retirado y pagado en la farmacia puede ser
            objeto de desistimiento, conforme a los usos aplicables a los productos
            de higiene y cuidado una vez abiertos.
          </p>
        </LegalSection>

        <LegalSection id="conformite" num="08." title="Conformidad e información del producto">
          <p>
            Todos los productos referenciados son importados por los distribuidores
            autorizados en República Dominicana. Cumplen las normas aplicables en su
            país de origen (FDA, EMA, ANMAT, ANVISA según las marcas), así como la
            reglamentación dominicana en materia de productos cosméticos.
          </p>
          <p>
            Las fichas de producto muestran a título indicativo: composición (INCI),
            modo de uso y contraindicaciones conocidas. Esta información no sustituye
            el consejo farmacéutico. En caso de duda, consulte a su farmacéutico.
          </p>
        </LegalSection>

        <LegalSection id="responsabilite" num="09." title="Responsabilidad de FARMAU">
          <p>
            FARMAU se compromete a ofrecer un servicio de calidad y a facilitar la
            información más exacta posible. No obstante, su responsabilidad no podrá
            comprometerse:
          </p>
          <ul>
            <li>en caso de indisponibilidad técnica del sitio (mantenimiento, fuerza mayor);</li>
            <li>en caso de rotura de stock entre la reserva y la confirmación;</li>
            <li>en caso de uso indebido de un producto fuera de sus indicaciones;</li>
            <li>en caso de reacción individual imprevisible a un componente cosmético.</li>
          </ul>
          <p>
            La responsabilidad de FARMAU se limita al importe de los productos
            efectivamente pagados en la farmacia.
          </p>
        </LegalSection>

        <LegalSection id="suppression-compte" num="10." title="Suspensión y eliminación de la cuenta">
          <p>
            Puede solicitar la eliminación de su cuenta en cualquier momento
            escribiéndonos a{' '}
            <a href="mailto:contact@farmau.do">contact@farmau.do</a>.
            La eliminación es efectiva en un plazo de 30 días e implica el borrado
            de los datos personales, sin perjuicio de las obligaciones legales de
            conservación (véase la{' '}
            <Link href="/legal/confidentialite">política de privacidad</Link>).
          </p>
          <p>
            FARMAU se reserva el derecho de suspender o eliminar cualquier cuenta en
            caso de uso abusivo, fraudulento o contrario a las presentes
            condiciones.
          </p>
        </LegalSection>

        <LegalSection id="donnees" num="11." title="Datos personales y cookies">
          <p>
            El tratamiento de sus datos personales se detalla en nuestra{' '}
            <Link href="/legal/confidentialite">política de privacidad</Link>. El
            uso de cookies se describe en la{' '}
            <Link href="/legal/cookies">política de cookies</Link>.
          </p>
        </LegalSection>

        <LegalSection id="modification" num="12." title="Modificación de las condiciones">
          <p>
            FARMAU se reserva el derecho de modificar las presentes condiciones en
            cualquier momento. La versión aplicable es la publicada en línea en el
            momento de la creación de la reserva. Las modificaciones sustanciales le
            serán notificadas por correo electrónico o mediante una notificación en
            la cuenta.
          </p>
        </LegalSection>

        <LegalSection id="loi-applicable" num="13." title="Ley aplicable y jurisdicción">
          <p>
            Las presentes condiciones se rigen por el derecho dominicano. Todo
            litigio relativo a su interpretación o ejecución será sometido, a falta
            de resolución amistosa, a la competencia exclusiva de los tribunales de
            Santiago, República Dominicana.
          </p>
        </LegalSection>
      </>
    ),
  },
}

export default async function CGVPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const c = CONTENT[locale] ?? CONTENT.fr

  return (
    <LegalShell
      activeSlug="cgv"
      eyebrow={c.eyebrow}
      title={c.title}
      lastUpdatedISO={LAST_UPDATED_ISO}
      intro={c.intro}
    >
      {c.sections}
    </LegalShell>
  )
}
