'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Instagram, Facebook, Youtube } from 'lucide-react'
import { SiTiktok } from 'react-icons/si'
import { useTranslations } from 'next-intl'

export default function Footer() {
  const t = useTranslations('Footer')
  return (
    <footer className="bg-sand-400 text-ink-800">
      <div className="grid grid-cols-4 gap-8 p-8">
        <div className="flex flex-col items-center">
          <Image src="/image/logo_trans.png" alt={t('logoAlt')} width={100} height={100} />
          <div className="flex gap-6 mt-4">
            <Instagram className="w-6 h-6 cursor-pointer" />
            <SiTiktok className="w-6 h-6 cursor-pointer" />
            <Facebook className="w-6 h-6 cursor-pointer" />
            <Youtube className="w-6 h-6 cursor-pointer" />
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">{t('productsHeading')}</h3>
          <ul className="space-y-1 text-sm">
            <li>{t('products.cleansers')}</li>
            <li>{t('products.serums')}</li>
            <li>{t('products.masks')}</li>
            <li>{t('products.essences')}</li>
            <li>{t('products.dayCreams')}</li>
            <li>{t('products.nightCreams')}</li>
            <li>{t('products.eyeCare')}</li>
            <li>{t('products.lipCare')}</li>
            <li>{t('products.uvCare')}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">{t('needsHeading')}</h3>
          <ul className="space-y-1 text-sm">
            <li>{t('needs.wrinkles')}</li>
            <li>{t('needs.hydration')}</li>
            <li>{t('needs.firmness')}</li>
            <li>{t('needs.darkCircles')}</li>
            <li>{t('needs.regeneration')}</li>
            <li>{t('needs.antiAging')}</li>
            <li>{t('needs.radiance')}</li>
            <li>{t('needs.cleansing')}</li>
            <li>{t('needs.sunProtection')}</li>
            <li>{t('needs.wrinklesImperfections')}</li>
            <li>{t('needs.spots')}</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2">{t('serviceHeading')}</h3>
          <ul className="space-y-1 text-sm">
            <li><Link href="/contact" className="hover:underline">{t('service.contact')}</Link></li>
            <li>{t('service.stores')}</li>
          </ul>
          <h3 className="font-semibold mt-4 mb-2">{t('brandHeading')}</h3>
          <ul className="space-y-1 text-sm">
            <li>{t('brand.about')}</li>
            <li>{t('brand.values')}</li>
            <li>{t('brand.team')}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sand-300 text-center p-4 text-sm">
        {t('copyright')}
      </div>
    </footer>
  )
}
