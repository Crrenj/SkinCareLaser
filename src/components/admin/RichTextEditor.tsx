'use client'

import { useEditor, EditorContent, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExt from '@tiptap/extension-image'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Quote, Link as LinkIcon, Image as ImageIcon, Undo2, Redo2, Loader2,
} from 'lucide-react'
import { uploadImage, UploadError, IMAGE_ACCEPT } from '@/lib/uploadImage'

type Props = {
  value: string
  onChange: (html: string) => void
}

/** Éditeur visuel (WYSIWYG) pour le corps d'un article. Sortie = HTML simple,
 *  nettoyé par DOMPurify à l'affichage public. Aucune saisie de HTML brut. */
export function RichTextEditor({ value, onChange }: Props) {
  const t = useTranslations('Admin.editor')
  const tu = useTranslations('Admin.upload')
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
        },
      }),
      ImageExt.configure({ HTMLAttributes: { class: 'rounded-lg' } }),
    ],
    content: value || '',
    editorProps: {
      attributes: { class: 'article-content min-h-[280px] px-4 py-3 focus:outline-none' },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive('bold'),
            italic: editor.isActive('italic'),
            h2: editor.isActive('heading', { level: 2 }),
            h3: editor.isActive('heading', { level: 3 }),
            bullet: editor.isActive('bulletList'),
            ordered: editor.isActive('orderedList'),
            quote: editor.isActive('blockquote'),
            link: editor.isActive('link'),
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
          }
        : null,
  })

  // Synchronise un contenu externe (ouverture d'un article existant) sans
  // écraser la frappe en cours (le garde-fou évite le reset quand c'est égal).
  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [value, editor])

  async function handleImageFile(file: File) {
    setUploading(true)
    try {
      const url = await uploadImage(file, 'blog')
      editor?.chain().focus().setImage({ src: url }).run()
    } catch (err) {
      const code = err instanceof UploadError ? err.code : 'server'
      toast.error(code === 'type' ? tu('errorType') : code === 'size' ? tu('errorSize') : tu('errorGeneric'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function toggleLink() {
    if (!editor) return
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }
    const url = window.prompt(t('linkPrompt')) ?? ''
    if (url.trim()) editor.chain().focus().setLink({ href: url.trim() }).run()
  }

  if (!editor || !state) {
    return <div className="min-h-[330px] animate-pulse rounded-lg border border-sand-300 bg-sand-50" />
  }

  return (
    <div className="overflow-hidden rounded-lg border border-sand-300 bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-sand-200 bg-sand-50 px-2 py-1.5">
        <ToolBtn title={t('bold')} active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title={t('italic')} active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <Divider />
        <ToolBtn title={t('h2')} active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title={t('h3')} active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </ToolBtn>
        <Divider />
        <ToolBtn title={t('bulletList')} active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title={t('orderedList')} active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title={t('quote')} active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolBtn>
        <Divider />
        <ToolBtn title={t('link')} active={state.link} onClick={toggleLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title={t('image')} disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </ToolBtn>
        <Divider />
        <ToolBtn title={t('undo')} disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title={t('redo')} disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </ToolBtn>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleImageFile(f)
        }}
      />

      <EditorContent editor={editor} />
    </div>
  )
}

function ToolBtn({
  onClick, active, title, disabled, children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-40 ${
        active ? 'bg-ink-900 text-sand-50' : 'text-ink-700 hover:bg-sand-200'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-sand-300" aria-hidden />
}
