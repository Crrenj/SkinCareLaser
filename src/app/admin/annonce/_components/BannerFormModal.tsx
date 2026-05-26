'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useModalA11y } from '@/hooks/useModalA11y'
import type { BannerData, BannerFormState, BannerType } from '../_lib/types'

type BannerFormModalProps = {
  open: boolean
  editingBanner: BannerData | null
  form: BannerFormState
  onFormChange: (next: BannerFormState) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  saving: boolean
}

const NEW_TYPES: BannerType[] = ['editorial', 'hero', 'quote']

const TYPE_HINTS: Record<'editorial' | 'hero' | 'quote', string> = {
  editorial:
    'Image + texte 2 colonnes, 320px. Pour mettre en avant un produit ou une gamme.',
  hero: 'Plein-bleed avec overlay sombre, 480px. Pour le hero de la home ou une campagne.',
  quote:
    'Citation pharmacien sur fond ink-900, 220px. Pas de CTA, pas d image requise.',
}

const IMAGE_HINTS: Record<'editorial' | 'hero' | 'quote', string> = {
  editorial: 'Editorial : 400×400 pixels (carré ou portrait), object-contain — packshot ou ambiance.',
  hero: 'Hero : 1200×600 pixels (ratio 2:1), object-cover plein-bleed — ambiance, pas packshot.',
  quote:
    "Quote : image non utilisée. Si fournie, sert d'avatar 140×140 (rond). Sinon, le bloc passe en pleine largeur.",
}

export function BannerFormModal({
  open,
  editingBanner,
  form,
  onFormChange,
  onClose,
  onSubmit,
  saving,
}: BannerFormModalProps) {
  const dialogRef = useModalA11y(open, onClose)
  if (!open) return null

  const isNewType = (NEW_TYPES as BannerType[]).includes(form.banner_type)
  const hintType = isNewType ? (form.banner_type as 'editorial' | 'hero' | 'quote') : 'editorial'

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="annonce-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="annonce-modal-title" className="text-lg font-bold text-gray-900">
            {editingBanner ? 'Modifier la bannière' : 'Créer une bannière'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="banner-title" className="block text-sm font-medium text-gray-700">
              Titre
            </label>
            <input
              id="banner-title"
              type="text"
              required
              value={form.title}
              onChange={(e) => onFormChange({ ...form, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="banner-description"
              className="block text-sm font-medium text-gray-700"
            >
              {form.banner_type === 'quote' ? 'Citation (le texte du quote)' : 'Description'}
            </label>
            <textarea
              id="banner-description"
              required={form.banner_type !== 'quote'}
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder={
                form.banner_type === 'quote'
                  ? 'La citation peut aussi rester dans le champ Titre — Description est optionnelle.'
                  : ''
              }
            />
            {form.banner_type !== 'hero' && form.banner_type !== 'quote' && (
              <p className="mt-1 text-xs text-gray-500">
                Astuce : utilisez <code>&lt;em&gt;mot&lt;/em&gt;</code> dans le titre pour mettre
                un mot en italique clay.
              </p>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Type de bannière</span>
            <div className="grid grid-cols-3 gap-2">
              {NEW_TYPES.map((type) => (
                <label
                  key={type}
                  className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-md cursor-pointer text-sm transition-colors ${
                    form.banner_type === type
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="banner_type"
                    value={type}
                    checked={form.banner_type === type}
                    onChange={() => onFormChange({ ...form, banner_type: type })}
                    className="sr-only"
                  />
                  <span className="font-medium capitalize">{type}</span>
                </label>
              ))}
            </div>
            {isNewType && <p className="mt-1 text-xs text-gray-500">{TYPE_HINTS[hintType]}</p>}
          </div>

          {form.banner_type === 'editorial' && (
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">Direction</span>
              <div className="grid grid-cols-2 gap-2">
                {(['left', 'right'] as const).map((dir) => (
                  <label
                    key={dir}
                    className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-md cursor-pointer text-sm transition-colors ${
                      form.direction === dir
                        ? 'border-ink-900 bg-gray-100'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="direction"
                      value={dir}
                      checked={form.direction === dir}
                      onChange={() => onFormChange({ ...form, direction: dir })}
                      className="sr-only"
                    />
                    Image à {dir === 'left' ? 'gauche' : 'droite'}
                  </label>
                ))}
              </div>
            </div>
          )}

          {form.banner_type === 'quote' && (
            <div className="space-y-3 bg-gray-50 p-4 rounded-md">
              <div className="text-sm font-medium text-gray-700">Attribution</div>
              <div>
                <label
                  htmlFor="banner-attribution-name"
                  className="block text-xs text-gray-600 mb-1"
                >
                  Nom (ex: Dra. María Rosa Cabrera)
                </label>
                <input
                  id="banner-attribution-name"
                  type="text"
                  value={form.attribution_name}
                  onChange={(e) =>
                    onFormChange({ ...form, attribution_name: e.target.value })
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="banner-attribution-title"
                  className="block text-xs text-gray-600 mb-1"
                >
                  Titre (ex: Pharmacienne, Santo Domingo)
                </label>
                <input
                  id="banner-attribution-title"
                  type="text"
                  value={form.attribution_title}
                  onChange={(e) =>
                    onFormChange({ ...form, attribution_title: e.target.value })
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="banner-attribution-photo"
                  className="block text-xs text-gray-600 mb-1"
                >
                  Photo URL (optionnelle)
                </label>
                <input
                  id="banner-attribution-photo"
                  type="url"
                  value={form.attribution_photo_url}
                  onChange={(e) =>
                    onFormChange({ ...form, attribution_photo_url: e.target.value })
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://…"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="banner-image" className="block text-sm font-medium text-gray-700">
              URL de l&apos;image{' '}
              {form.banner_type === 'quote' && (
                <span className="text-gray-400 text-xs">(optionnelle pour quote)</span>
              )}
            </label>
            <input
              id="banner-image"
              type="url"
              required={form.banner_type !== 'quote'}
              value={form.image_url}
              onChange={(e) => onFormChange({ ...form, image_url: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="https://example.com/image.jpg"
            />
            <div className="mt-2 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800 font-medium mb-1">📏 Tailles recommandées :</p>
              <div className="text-xs text-blue-700 space-y-1">
                {isNewType && (
                  <p>
                    • <strong>{hintType}:</strong> {IMAGE_HINTS[hintType]}
                  </p>
                )}
                <p>• Format recommandé : JPG ou PNG</p>
                <p>• Poids maximum : 500 KB pour des performances optimales</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="banner-position"
                className="block text-sm font-medium text-gray-700"
              >
                Position
              </label>
              <input
                id="banner-position"
                type="number"
                min="1"
                value={form.position}
                onChange={(e) =>
                  onFormChange({ ...form, position: parseInt(e.target.value, 10) || 1 })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Ordre d&apos;affichage (1 = premier)</p>
            </div>
            <div>
              <label htmlFor="banner-link" className="block text-sm font-medium text-gray-700">
                URL du lien
              </label>
              <input
                id="banner-link"
                type="url"
                value={form.link_url}
                onChange={(e) => onFormChange({ ...form, link_url: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="banner-link-text"
                className="block text-sm font-medium text-gray-700"
              >
                Texte du bouton
              </label>
              <input
                id="banner-link-text"
                type="text"
                value={form.link_text}
                onChange={(e) => onFormChange({ ...form, link_text: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="banner-start" className="block text-sm font-medium text-gray-700">
                Date de début
              </label>
              <input
                id="banner-start"
                type="date"
                value={form.start_date}
                onChange={(e) => onFormChange({ ...form, start_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="banner-end" className="block text-sm font-medium text-gray-700">
                Date de fin
              </label>
              <input
                id="banner-end"
                type="date"
                value={form.end_date}
                onChange={(e) => onFormChange({ ...form, end_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="banner-is-active"
              checked={form.is_active}
              onChange={(e) => onFormChange({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="banner-is-active" className="ml-2 block text-sm text-gray-900">
              Bannière active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {saving ? 'Sauvegarde...' : editingBanner ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
