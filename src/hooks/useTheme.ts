import { useState, useEffect } from 'react'

interface ThemeAPI {
  theme: string
  toggle: (e?: React.MouseEvent | MouseEvent) => void
}

export function useTheme(): ThemeAPI {
  const [theme, setTheme] = useState<string>(
    () => localStorage.getItem('psp-theme') || 'light'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('psp-theme', theme)
  }, [theme])

  const toggle = (e?: React.MouseEvent | MouseEvent) => {
    const x = e?.clientX ?? window.innerWidth / 2
    const y = e?.clientY ?? window.innerHeight / 2

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    if (!document.startViewTransition) {
      setTheme(t => t === 'light' ? 'dark' : 'light')
      return
    }

    const transition = document.startViewTransition(() => {
      setTheme(t => t === 'light' ? 'dark' : 'light')
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    })
  }

  return { theme, toggle }
}
