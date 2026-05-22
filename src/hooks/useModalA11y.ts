import { useEffect, useRef } from 'react'

/**
 * Hook a11y pour les modales : focus trap + Escape + scroll lock du body
 * + restauration du focus à la fermeture.
 *
 * Usage :
 *   const dialogRef = useModalA11y(open, onClose)
 *   return (
 *     <div className="fixed inset-0 ..." onClick={onClose} aria-hidden="true">
 *       <div
 *         ref={dialogRef}
 *         role="dialog"
 *         aria-modal="true"
 *         aria-labelledby="my-modal-title"
 *         tabIndex={-1}
 *         onClick={(e) => e.stopPropagation()}
 *       >
 *         <h2 id="my-modal-title">...</h2>
 *         ...
 *       </div>
 *     </div>
 *   )
 */
export function useModalA11y(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previousActive = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current

    // Focus initial sur le premier élément focusable du dialog
    if (dialog) {
      const first = dialog.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      ;(first ?? dialog).focus()
    }

    // Body scroll lock
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Escape + Tab trap
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !dialog) return
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      previousActive?.focus()
    }
  }, [open, onClose])

  return dialogRef
}
