import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { LegalShell } from '@/components/legal/LegalShell'
import { LegalSection } from '@/components/legal/LegalSection'
import { Link } from '@/i18n/navigation'
import { buildLanguageAlternates, localizedPath } from '@/lib/seo'

const LAST_UPDATED_ISO = '2026-05-21'

export const revalidate = 86400 // 24h

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Legal.pageMeta.mentions' })
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, '/legal/mentions-legales'),
      languages: buildLanguageAlternates('/legal/mentions-legales'),
    },
  }
}

export default async function MentionsLegalesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <LegalShell
      activeSlug="mentions-legales"
      eyebrow="Information éditeur"
      title="Mentions légales"
      lastUpdatedISO={LAST_UPDATED_ISO}
      intro="Conformément à la Ley No. 358-05 sur la Protection des Droits du Consommateur et la Ley No. 126-02 sur le Commerce Électronique de la République Dominicaine, vous trouverez ci-dessous les informations relatives à l'éditeur du site farmau.do."
    >
      <LegalSection id="editeur" num="01." title="Éditeur du site">
        <p>
          Le site <strong>farmau.do</strong> est édité par <strong>FARMAU SRL</strong>{' '}
          (à confirmer), Société à Responsabilité Limitée de droit dominicain.
        </p>
        <ul>
          <li><strong>Nom commercial :</strong> FARMAU — Pharmacie dermo-cosmétique</li>
          <li><strong>RNC :</strong> [à compléter par l&apos;éditeur]</li>
          <li><strong>Siège social :</strong> Calle Jesús de Galíndez, esq. Calle 3, Cerros de Gurabo, Santiago, République Dominicaine</li>
          <li><strong>Capital social :</strong> [à compléter]</li>
          <li><strong>Représentant légal :</strong> [Nom, qualité]</li>
        </ul>
      </LegalSection>

      <LegalSection id="contact" num="02." title="Contact">
        <ul>
          <li><strong>Email :</strong> <a href="mailto:contact@farmau.do">contact@farmau.do</a></li>
          <li><strong>Téléphone :</strong> <a href="tel:+18097243940">+1 809 724 3940</a></li>
          <li><strong>WhatsApp :</strong> <a href="https://wa.me/18094122468">+1 809 412 2468</a></li>
          <li><strong>Horaires :</strong> Lundi à vendredi, 9h–19h (UTC−4)</li>
        </ul>
      </LegalSection>

      <LegalSection id="publication" num="03." title="Directeur de la publication">
        <p>
          Le directeur de la publication est le représentant légal de FARMAU SRL.
          Pour toute question éditoriale, contactez{' '}
          <a href="mailto:contact@farmau.do">contact@farmau.do</a>.
        </p>
      </LegalSection>

      <LegalSection id="hebergement" num="04." title="Hébergement du site">
        <p>
          Le site est hébergé par <strong>Vercel Inc.</strong>, société américaine
          dont le siège est situé au 440 N Barranca Ave #4133, Covina, CA 91723,
          États-Unis. Site web :{' '}
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
            vercel.com
          </a>.
        </p>
        <p>
          Les données applicatives (catalogue, comptes, réservations) sont stockées
          chez <strong>Supabase Inc.</strong>, 970 Toa Payoh North #07-04, Singapour,
          via une base PostgreSQL gérée. Site web :{' '}
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
            supabase.com
          </a>.
        </p>
      </LegalSection>

      <LegalSection id="propriete-intellectuelle" num="05." title="Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments composant le site farmau.do — textes éditoriaux,
          photographies, illustrations, identité visuelle FARMAU, code source, base
          de données structurée — est protégé par les lois en vigueur sur la
          propriété intellectuelle, notamment la Ley No. 65-00 sur les Droits
          d&apos;Auteur de la République Dominicaine.
        </p>
        <p>
          Toute reproduction, représentation, modification ou exploitation totale ou
          partielle de ces éléments, par quelque procédé que ce soit, sans
          l&apos;autorisation expresse et préalable de FARMAU, est strictement interdite
          et constitue une contrefaçon sanctionnée par la loi.
        </p>
      </LegalSection>

      <LegalSection id="marques-tiers" num="06." title="Marques tierces et crédits">
        <p>
          Les marques commerciales citées sur le site (ISDIN, La Roche-Posay, Avène,
          Filorga, ACM, Uriage, A-Derma, Ducray, EltaMD, Babe, Atache, Levissime,
          Genové, Isispharma et toute autre marque référencée) restent la propriété
          exclusive de leurs détenteurs respectifs.
        </p>
        <p>
          FARMAU est un distributeur agréé et présente ces produits dans le respect
          des conditions commerciales de chaque marque. Les visuels produits sont
          utilisés à des fins d&apos;identification dans le cadre de la distribution.
        </p>
      </LegalSection>

      <LegalSection id="responsabilite" num="07." title="Limitation de responsabilité">
        <p>
          FARMAU s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations
          présentées sur le site. Toutefois, FARMAU ne peut être tenue responsable
          des erreurs, omissions ou résultats qui pourraient être obtenus par un
          mauvais usage de ces informations.
        </p>
        <p>
          Les informations dermo-cosmétiques publiées sur le site sont fournies à
          titre indicatif et ne se substituent en aucun cas à une consultation
          médicale ou pharmaceutique. En cas de doute, consultez votre pharmacien
          ou votre dermatologue.
        </p>
      </LegalSection>

      <LegalSection id="liens-externes" num="08." title="Liens externes">
        <p>
          Le site farmau.do peut contenir des liens vers des sites tiers (réseaux
          sociaux, sites des marques distribuées). FARMAU n&apos;exerce aucun contrôle
          sur le contenu de ces sites et décline toute responsabilité quant à leur
          contenu, leurs politiques de confidentialité ou leurs pratiques.
        </p>
      </LegalSection>

      <LegalSection id="loi-applicable" num="09." title="Loi applicable et juridiction">
        <p>
          Les présentes mentions sont régies par le droit de la République
          Dominicaine. En cas de litige, et après tentative de résolution amiable,
          compétence est attribuée aux tribunaux du Distrito Nacional de Santo
          Domingo, sauf disposition légale contraire.
        </p>
      </LegalSection>

      <LegalSection id="contact-mentions" num="10." title="Pour toute question">
        <p>
          Pour toute question relative aux présentes mentions légales, vous pouvez
          nous écrire à{' '}
          <a href="mailto:contact@farmau.do">contact@farmau.do</a> ou
          via la page <Link href="/contact">Contact</Link>.
        </p>
      </LegalSection>
    </LegalShell>
  )
}
