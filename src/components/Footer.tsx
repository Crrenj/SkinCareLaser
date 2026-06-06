import { Instagram, Facebook } from 'lucide-react'
import { SiWhatsapp } from 'react-icons/si'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { FooterNewsletter } from './footer/FooterNewsletter'
import { FarmauBird, FarmauWord } from './brand/FarmauLogo'
import { ThemeModeToggle } from './ThemeModeToggle'
import { getShopSettings, whatsappHref } from '@/lib/getShopSettings'

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

// Colonne « La réservation » — renforce le mode opératoire FARMAU (réserver →
// confirmation WhatsApp → retrait & paiement au comptoir). Routes réelles.
const RESERVATION_LINKS = [
  { key: 'howItWorks', href: '/livraison' },
  { key: 'pickup', href: '/pharmacie' },
  { key: 'payment', href: '/faq' },
  { key: 'track', href: '/account/reservations' },
] as const

// Colonne FARMAU — réutilise les libellés brand.*/service.* existants (clé = chemin complet).
const FARMAU_LINKS = [
  { key: 'brand.about', href: '/a-propos' },
  { key: 'service.contact', href: '/contact' },
  { key: 'brand.brands', href: '/marques' },
  { key: 'brand.stores', href: '/pharmacie' },
] as const

export default async function Footer() {
  const t = await getTranslations('Footer')
  const settings = await getShopSettings()
  const waLink = whatsappHref(settings.whatsapp_number) ?? '#'

  return (
    <>
      <FooterNewsletter />
      <footer className="bg-[var(--c-ink-panel)] text-[var(--c-ink-panel-fg)]">
        <div className="mx-auto max-w-[1440px] px-[clamp(20px,6vw,104px)] pt-[clamp(40px,5vw,72px)] pb-8">
      {/* Grid 4 colonnes (mock compact : Marque · Catalogue · Réservation · FARMAU) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 lg:gap-12 pb-[clamp(36px,4vw,56px)] border-b border-[var(--c-ink-panel-border)]">
        {/* Brand column */}
        <div className="flex flex-col gap-5 max-w-[320px]">
          <span className="inline-flex items-center gap-3" aria-label="FARMAU">
            <FarmauBird size={48} color="var(--c-ink-panel-accent)" />
            <FarmauWord width={92} color="var(--c-ink-panel-fg)" />
          </span>
          <p
            className="font-serif italic text-[16px] md:text-[17px] leading-[1.5] text-[var(--c-ink-panel-muted)]"
            dangerouslySetInnerHTML={{ __html: t.raw('tagline') as string }}
          />
          <div className="flex gap-2.5 mt-1">
            <SocialIcon href="https://instagram.com" label={t('socials.instagram')}>
              <Instagram size={16} strokeWidth={1.6} />
            </SocialIcon>
            <SocialIcon href={waLink} label={t('socials.whatsapp')}>
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

        <FooterColumn heading={t('reservationHeading')}>
          {RESERVATION_LINKS.map((link) => (
            <FooterLink key={link.key} href={link.href} label={t(`reservation.${link.key}`)} />
          ))}
        </FooterColumn>

        <FooterColumn heading={t('brandHeading')}>
          {FARMAU_LINKS.map((link) => (
            <FooterLink key={link.key} href={link.href} label={t(link.key)} />
          ))}
        </FooterColumn>
      </div>

      {/* Bottom bar */}
      <div className="pt-7 flex flex-col gap-3 md:flex-row md:items-center md:justify-between font-mono text-[11px] text-[var(--c-ink-panel-muted)]">
        <div>{t('bottom.copyright')}</div>
        <div className="flex flex-wrap gap-5">
          <FooterLegalLink href="/legal/cgv" label={t('bottom.terms')} />
          <FooterLegalLink href="/legal/confidentialite" label={t('bottom.privacy')} />
          <FooterLegalLink href="/legal/cookies" label={t('bottom.cookies')} />
          <FooterLegalLink href="/legal/mentions-legales" label={t('bottom.legal')} />
        </div>
        <div className="flex items-center gap-3">
          {/* Pas de badges de paiement : FARMAU est sans paiement en ligne
              (réservation + retrait/coordination WhatsApp). */}
          <ThemeModeToggle />
        </div>
      </div>
        </div>
      </footer>
    </>
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
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--c-ink-panel-accent)] font-semibold mb-4">
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
        className="text-[13px] text-[var(--c-ink-panel-muted)] hover:text-[var(--c-ink-panel-fg)] transition-colors"
      >
        {label}
      </Link>
    </li>
  )
}

function FooterLegalLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-[var(--c-ink-panel-muted)] hover:text-[var(--c-ink-panel-fg)] transition-colors"
    >
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
      className="w-9 h-9 rounded-full border border-[var(--c-ink-panel-border)] flex items-center justify-center text-[var(--c-ink-panel-fg)] hover:border-[var(--c-ink-panel-accent)] hover:text-[var(--c-ink-panel-accent)] transition-colors"
    >
      {children}
    </a>
  )
}
