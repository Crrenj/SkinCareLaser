/**
 * Upload d'image admin → bucket Storage `product-image` (sous-dossier par usage).
 * Partagé par ImageUploadField (couverture blog, image/photo bannière) et
 * RichTextEditor (images insérées dans le corps d'un article).
 *
 * La validation type/taille est faite ici ET re-vérifiée côté serveur
 * (src/app/api/admin/upload/route.ts) — défense en profondeur.
 */
export type UploadFolder = 'products' | 'blog' | 'banners'

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 Mo (aligné avec le bucket)
export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp'

/** Erreur typée : `code` permet au composant d'afficher un message localisé. */
export class UploadError extends Error {
  code: 'type' | 'size' | 'server'
  constructor(code: 'type' | 'size' | 'server', message?: string) {
    super(message ?? code)
    this.code = code
  }
}

/** Valide puis upload le fichier ; renvoie l'URL publique. Lève UploadError. */
export async function uploadImage(file: File, folder: UploadFolder): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new UploadError('type')
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError('size')

  const base64 = await fileToBase64(file)
  let res: Response
  try {
    res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: base64, fileName: file.name, contentType: file.type, folder }),
    })
  } catch {
    throw new UploadError('server')
  }

  const data = await res.json().catch(() => ({} as { url?: string; error?: string }))
  if (!res.ok || !data.url) {
    throw new UploadError('server', data.error)
  }
  return data.url
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result?.toString().split(',')[1] ?? '')
    reader.onerror = () => reject(new UploadError('server'))
    reader.readAsDataURL(file)
  })
}
