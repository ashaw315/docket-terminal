'use client'

import { useEffect, useRef, ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  labelledBy?: string
  children: ReactNode
}

export function Modal({ open, onClose, labelledBy, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const lastFocused = useRef<Element | null>(null)

  useEffect(() => {
    if (!open) return
    lastFocused.current = document.activeElement
    const first = panelRef.current?.querySelector<HTMLElement>(
      'input, textarea, button, select, [tabindex]:not([tabindex="-1"])'
    )
    first?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'input, textarea, button, select, [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length === 0) return
        const firstEl = focusables[0]
        const lastEl = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="w-full max-w-md border border-zinc-800 bg-zinc-900 p-6"
      >
        {children}
      </div>
    </div>
  )
}
