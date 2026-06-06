'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { generateSlug } from '@/lib/slug'
import { useModalA11y } from '@/hooks/useModalA11y'
import { toast } from 'sonner'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { ImageUploadField } from '@/components/admin/ImageUploadField'

type Post = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body: string
  cover_image_url: string | null
  author_name: string | null
  locale: string
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

type FormData = {
  title: string
  slug: string
  excerpt: string
  body: string
  cover_image_url: string
  author_name: string
  locale: 'fr' | 'es' | 'en'
  is_published: boolean
}

const EMPTY_FORM: FormData = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  cover_image_url: '',
  author_name: '',
  locale: 'fr',
  is_published: false,
}

export function BlogClient() {
  const t = useTranslations('Admin.blog')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingPost(null)
    setForm(EMPTY_FORM)
  }, [])

  const dialogRef = useModalA11y<HTMLDivElement>(modalOpen, closeModal)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/posts')
    if (res.ok) {
      const data = await res.json()
      setPosts(data.posts ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  function openCreate() {
    setEditingPost(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEdit(post: Post) {
    setEditingPost(post)
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      body: post.body,
      cover_image_url: post.cover_image_url ?? '',
      author_name: post.author_name ?? '',
      locale: post.locale as 'fr' | 'es' | 'en',
      is_published: post.is_published,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error(t('errorTitleSlug'))
      return
    }
    setSaving(true)
    const method = editingPost ? 'PATCH' : 'POST'
    const payload = editingPost
      ? { id: editingPost.id, ...form }
      : form
    const res = await fetch('/api/admin/posts', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur' }))
      toast.error(err.error)
      return
    }
    toast.success(editingPost ? t('updated') : t('created'))
    closeModal()
    fetchPosts()
  }

  async function handleDelete(post: Post) {
    const res = await fetch('/api/admin/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id }),
    })
    if (res.ok) {
      toast.success(t('deleted'))
      fetchPosts()
    } else {
      toast.error(t('deleteError'))
    }
  }

  function onTitleChange(title: string) {
    setForm(f => ({
      ...f,
      title,
      slug: !editingPost ? generateSlug(title) : f.slug,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-ink-500 font-mono text-sm">
          {posts.length} {t('articles')}
        </p>
        <button
          onClick={openCreate}
          className="rounded-lg bg-clay-700 px-5 py-2.5 text-sm font-medium text-on-accent hover:bg-clay-800 transition-colors"
        >
          {t('newPost')}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-lg bg-sand-200 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl bg-sand-50 border border-sand-200 p-12 text-center">
          <p className="text-ink-500 text-sm">{t('empty')}</p>
        </div>
      ) : (
        <div className="rounded-xl bg-sand-50 border border-sand-200 divide-y divide-sand-200">
          {posts.map(post => (
            <div key={post.id} className="flex items-center justify-between px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3
                    className="font-serif text-lg text-ink-900 truncate cursor-pointer hover:underline"
                    onClick={() => openEdit(post)}
                  >
                    {post.title}
                  </h3>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    post.is_published
                      ? 'bg-olive-100 text-olive-700'
                      : 'bg-sand-200 text-ink-500'
                  }`}>
                    {post.is_published ? t('published') : t('draft')}
                  </span>
                  <span className="rounded-full bg-sand-200 px-2 py-0.5 text-xs font-mono text-ink-500 uppercase">
                    {post.locale}
                  </span>
                </div>
                <p className="text-sm text-ink-500 font-mono mt-0.5">
                  /{post.slug}
                  {post.published_at && ` · ${new Date(post.published_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => openEdit(post)}
                  className="rounded-lg px-3 py-1.5 text-sm text-ink-600 hover:bg-sand-200 transition-colors"
                >
                  {t('edit')}
                </button>
                <button
                  onClick={() => handleDelete(post)}
                  className="rounded-lg px-3 py-1.5 text-sm text-brick-600 hover:bg-brick-50 transition-colors"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-ink-900/40" onClick={closeModal} />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="blog-modal-title"
            tabIndex={-1}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-sand-50 shadow-xl mx-4 focus:outline-none"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-sand-200 bg-sand-50 px-6 py-4">
              <h2 id="blog-modal-title" className="font-serif text-xl text-ink-900">
                {editingPost ? t('editTitle') : t('createTitle')}
              </h2>
              <button onClick={closeModal} className="text-ink-500 hover:text-ink-700">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">{t('fieldTitle')}</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => onTitleChange(e.target.value)}
                  className="w-full rounded-lg border border-sand-300 bg-sand-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-clay-700 focus-visible:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">{t('fieldSlug')}</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="w-full rounded-lg border border-sand-300 bg-sand-50 px-3 py-2 text-sm font-mono focus-visible:ring-2 focus-visible:ring-clay-700 focus-visible:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('fieldLocale')}</label>
                  <select
                    value={form.locale}
                    onChange={e => setForm(f => ({ ...f, locale: e.target.value as 'fr' | 'es' | 'en' }))}
                    className="w-full rounded-lg border border-sand-300 bg-sand-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-clay-700 focus-visible:outline-none"
                  >
                    <option value="fr">Fran&ccedil;ais</option>
                    <option value="es">Espa&ntilde;ol</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">{t('fieldAuthor')}</label>
                  <input
                    type="text"
                    value={form.author_name}
                    onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
                    className="w-full rounded-lg border border-sand-300 bg-sand-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-clay-700 focus-visible:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">{t('fieldExcerpt')}</label>
                <textarea
                  value={form.excerpt}
                  onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-sand-300 bg-sand-50 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-clay-700 focus-visible:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">{t('fieldBody')}</label>
                <RichTextEditor
                  value={form.body}
                  onChange={body => setForm(f => ({ ...f, body }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">{t('fieldCover')}</label>
                <ImageUploadField
                  value={form.cover_image_url}
                  onChange={url => setForm(f => ({ ...f, cover_image_url: url }))}
                  folder="blog"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="is_published"
                  type="checkbox"
                  checked={form.is_published}
                  onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                  className="rounded border-sand-300 text-clay-700 focus-visible:ring-clay-700"
                />
                <label htmlFor="is_published" className="text-sm text-ink-700">{t('fieldPublished')}</label>
              </div>
            </div>
            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-sand-200 bg-sand-50 px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-lg px-4 py-2 text-sm text-ink-600 hover:bg-sand-200 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-clay-700 px-5 py-2 text-sm font-medium text-on-accent hover:bg-clay-800 transition-colors disabled:opacity-50"
              >
                {saving ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
