import React from 'react'
import Image from 'next/image'
import { Instagram, Facebook, Youtube } from 'lucide-react'
import { SiTiktok } from 'react-icons/si'

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#CCC5BD' }} className="text-primary">
      {/* Ligne 1 : grille 4 colonnes */}
      <div className="grid grid-cols-4 gap-8 p-8">
        {/* Colonne 1 : logo + réseaux */}
        <div className="flex flex-col items-center">
          <Image src="/image/logo_trans.png" alt="Logo" width={100} height={100} />
          <div className="flex gap-6 mt-4">
            <Instagram className="w-6 h-6 cursor-pointer" />
            <SiTiktok className="w-6 h-6 cursor-pointer" />  {/* TikTok aligné */}
            <Facebook className="w-6 h-6 cursor-pointer" />
            <Youtube className="w-6 h-6 cursor-pointer" />
          </div>
        </div>
        {/* Colonne 2 : PRODUITS */}
        <div>
          <h3 className="font-semibold mb-2">PRODUITS</h3>
          <ul className="space-y-1 text-sm">
            <li>Démaquillants & Nettoyants</li>
            <li>Sérums</li>
            <li>Masques & Exfoliants</li>
            <li>Essences</li>
            <li>Crèmes de jour</li>
            <li>Crèmes de nuit</li>
            <li>Soins yeux</li>
            <li>Soins lèvres</li>
            <li>Soins UV</li>
          </ul>
        </div>
        {/* Colonne 3 : BESOINS */}
        <div>
          <h3 className="font-semibold mb-2">BESOINS</h3>
          <ul className="space-y-1 text-sm">
            <li>Rides</li>
            <li>Hydratation</li>
            <li>Fermeté</li>
            <li>Cernes, rides et poches</li>
            <li>Régénération</li>
            <li>Anti-âge global</li>
            <li>Éclat</li>
            <li>Nettoyant</li>
            <li>Protection solaire</li>
            <li>Rides & Imperfections</li>
            <li>Taches</li>
          </ul>
        </div>
        {/* Colonne 4 : SERVICE + MARQUE */}
        <div>
          <h3 className="font-semibold mb-2">SERVICE</h3>
          <ul className="space-y-1 text-sm">
            <li>Contact</li>
            <li>Nos points de vente</li>
          </ul>
          <h3 className="font-semibold mt-4 mb-2">MARQUE</h3>
          <ul className="space-y-1 text-sm">
            <li>À propos de nous</li>
            <li>Nos valeurs</li>
            <li>Notre équipe</li>
          </ul>
        </div>
      </div>
      {/* Ligne 2 : copyright */}
      <div className="border-t border-gray-200 text-center p-4 text-sm">
        © 2025 SkinCareLaser. Tous droits réservés.
      </div>
    </footer>
  )
}
