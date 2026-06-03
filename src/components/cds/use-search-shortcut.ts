import { useEffect, RefObject } from 'react'

interface ShortcutOptions {
  key:   string
  meta?: boolean
  ctrl?: boolean
}

export function useCdsSearchShortcut(
  ref: RefObject<HTMLInputElement | null>,
  { key, meta = false, ctrl = false }: ShortcutOptions = { key: '' },
): void {
  useEffect(() => {
    if (!key) return
    const handler = (e: KeyboardEvent) => {
      const modOk = (meta && e.metaKey) || (ctrl && e.ctrlKey) || (!meta && !ctrl)
      if (modOk && e.key === key) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [ref, key, meta, ctrl])
}
