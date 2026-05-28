#!/usr/bin/env node
/**
 * Génère les favicons par thème depuis le logo officiel (disque + oiseau).
 *
 *   node scripts/build-favicons.cjs
 *   → public/favicons/{theme}-{16,32,64,180}.png   (6 thèmes × 4 tailles)
 *
 * Méthode : le PNG source `public/brand/farmau-mark.png` contient un disque
 * SOMBRE (zone opaque, ~78%) et un oiseau CLAIR (luminance élevée, ~9%).
 * On reproduit le rendu du handoff (disque = mask alpha, oiseau = mask
 * luminance par-dessus) en une passe :
 *     out.rgb = disc·(1−L) + bird·L      out.a = alpha source
 * où L = luminance normalisée du pixel source. Couleurs disque/oiseau par
 * thème = table du handoff (cf. src/lib/themes.ts → favicon).
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const SRC = path.join(__dirname, '..', 'public', 'brand', 'farmau-mark.png')
const OUT_DIR = path.join(__dirname, '..', 'public', 'favicons')
const SIZES = [16, 32, 64, 180]

const THEMES = {
  terra: { disc: '#1F1B16', bird: '#FBF8F4' },
  noir: { disc: '#0A0A0A', bird: '#FFFFFF' },
  botanico: { disc: '#5B6B3F', bird: '#F5F2EA' },
  coral: { disc: '#B86F4A', bird: '#FBF2EC' },
  marino: { disc: '#3D6B7A', bird: '#F0F4F5' },
  ambar: { disc: '#B5852B', bird: '#FAF4E6' },
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Source introuvable:', SRC)
    process.exit(1)
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const px = width * height
  let written = 0

  for (const [name, { disc, bird }] of Object.entries(THEMES)) {
    const [dr, dg, db] = hexToRgb(disc)
    const [br, bg, bb] = hexToRgb(bird)
    const out = Buffer.allocUnsafe(px * 4)

    for (let i = 0; i < px; i++) {
      const s = i * 4
      const a = data[s + 3]
      const L = (0.299 * data[s] + 0.587 * data[s + 1] + 0.114 * data[s + 2]) / 255
      out[s] = Math.round(dr * (1 - L) + br * L)
      out[s + 1] = Math.round(dg * (1 - L) + bg * L)
      out[s + 2] = Math.round(db * (1 - L) + bb * L)
      out[s + 3] = a
    }

    const master = sharp(out, { raw: { width, height, channels: 4 } })
    for (const size of SIZES) {
      const file = path.join(OUT_DIR, `${name}-${size}.png`)
      await master
        .clone()
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(file)
      written++
    }
    console.log(`✓ ${name} (disc ${disc} · bird ${bird}) → ${SIZES.length} PNG`)
  }
  console.log(`\nGénéré ${written} favicons dans public/favicons/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
