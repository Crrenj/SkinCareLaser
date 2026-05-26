import { Instagram, Facebook } from 'lucide-react'
import { SiWhatsapp } from 'react-icons/si'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { FooterNewsletter } from './footer/FooterNewsletter'

// `categories` tag_type est vide en DB (taxonomie à créer) ; en attendant on
// pointe les liens qui ont un besoin équivalent vers /besoins/[slug] et
// retombe sur /catalogue pour les autres (au lieu de filtres ?category=
// silencieusement ignorés).
const PRODUCT_LINKS = [
  { key: 'cleansers', href: '/besoins/nettoyage' },
  { key: 'serums', href: '/catalogue' },
  { key: 'creams', href: '/catalogue' },
  { key: 'masks', href: '/catalogue' },
  { key: 'sunCare', href: '/besoins/protection-solaire' },
  { key: 'bodyCare', href: '/catalogue' },
] as const

const NEED_SLUGS = [
  'hydratation',
  'anti-age',
  'protection-solaire',
  'acne',
  'taches',
  'nettoyage',
  'reparation',
  'apaisant',
  'cernes',
  'eclat',
  'rosacee',
  'chute-de-cheveux',
  'exfoliation',
  'pellicules',
] as const

const SERVICE_LINKS = [
  { key: 'contact', href: '/contact' },
  { key: 'delivery', href: '/livraison' },
  { key: 'pharmacists', href: '/a-propos' },
  { key: 'faq', href: '/faq' },
  { key: 'help', href: '/contact' },
] as const

const BRAND_LINKS = [
  { key: 'about', href: '/a-propos' },
  { key: 'manifesto', href: '/manifeste' },
  { key: 'brands', href: '/marques' },
  { key: 'blog', href: '/a-propos' },
  { key: 'stores', href: '/pharmacie' },
] as const

export default function Footer() {
  const t = useTranslations('Footer')

  return (
    <footer className="bg-ink-900 text-sand-200 px-6 lg:px-16 pt-16 lg:pt-20">
      <FooterNewsletter />

      {/* Grid 5 colonnes (2fr + 4×1fr) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10 lg:gap-12 mb-14">
        {/* Brand column */}
        <div className="flex flex-col gap-5 max-w-[320px]">
          <span
            className="inline-flex flex-col items-center justify-center w-14 h-14 rounded-full border-[1.5px] border-clay-400"
            aria-label="FARMAU"
          >
            <span className="font-serif italic text-[24px] text-clay-400 leading-none">F</span>
            <span className="font-sans text-[6.5px] uppercase tracking-[0.18em] text-clay-400 mt-px">
              FARMAU
            </span>
          </span>
          <p
            className="font-serif italic text-[16px] md:text-[17px] leading-[1.5] text-ink-500"
            dangerouslySetInnerHTML={{ __html: t.raw('tagline') as string }}
          />
          <div className="flex gap-2.5 mt-1">
            <SocialIcon href="https://instagram.com" label={t('socials.instagram')}>
              <Instagram size={16} strokeWidth={1.6} />
            </SocialIcon>
            <SocialIcon href="https://wa.me/18094122468" label={t('socials.whatsapp')}>
              <SiWhatsapp size={16} />
            </SocialIcon>
            <SocialIcon href="https://facebook.com" label={t('socials.facebook')}>
              <Facebook size={16} strokeWidth={1.6} />
            </SocialIcon>
          </div>
        </div>

        <FooterColumn heading={t('productsHeading')}>
          {PRODUCT_LINKS.map((link) => (
            <FooterLink
              key={link.key}
              href={link.href}
              label={t(`products.${link.key}`)}
            />
          ))}
        </FooterColumn>

        <FooterColumn heading={t('needsHeading')}>
          {NEED_SLUGS.map((slug) => (
            <FooterLink key={slug} href={`/besoins/${slug}`} label={t(`needs.${slug}`)} />
          ))}
        </FooterColumn>

        <FooterColumn heading={t('serviceHeading')}>
          {SERVICE_LINKS.map((link) => (
            <FooterLink key={link.key} href={link.href} label={t(`service.${link.key}`)} />
          ))}
        </FooterColumn>

        <FooterColumn heading={t('brandHeading')}>
          {BRAND_LINKS.map((link) => (
            <FooterLink key={link.key} href={link.href} label={t(`brand.${link.key}`)} />
          ))}
        </FooterColumn>
      </div>

      {/* Bottom bar */}
      <div className="py-6 border-t border-ink-800 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-[11.5px] text-ink-500">
        <div>{t('bottom.copyright')}</div>
        <div className="flex flex-wrap gap-5">
          <FooterLegalLink href="/legal/cgv" label={t('bottom.terms')} />
          <FooterLegalLink href="/legal/confidentialite" label={t('bottom.privacy')} />
          <FooterLegalLink href="/legal/cookies" label={t('bottom.cookies')} />
          <FooterLegalLink href="/legal/mentions-legales" label={t('bottom.legal')} />
        </div>
        <div className="flex gap-2">
          {['Visa', 'Mastercard', 'PayPal', 'Azul'].map((label) => (
            <span
              key={label}
              className="font-mono text-[10px] px-2 py-1 border border-ink-700 rounded-sm text-ink-500"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  heading,
  children,
}: {
  heading: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-clay-400 font-semibold mb-4">
        {heading}
      </div>
      <ul className="list-none p-0 m-0 grid gap-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="text-[13px] text-ink-500 hover:text-sand-50 transition-colors"
      >
        {label}
      </Link>
    </li>
  )
}

function FooterLegalLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-ink-500 hover:text-sand-200 transition-colors">
      {label}
    </Link>
  )
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-full border border-ink-700 flex items-center justify-center text-sand-200 hover:bg-ink-800 hover:border-clay-600 hover:text-clay-400 transition-colors"
    >
      {children}
    </a>
  )
}
