import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

const MOBILE_BP = 1024

export default function AppLayout() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)
  const [isMobile,   setIsMobile]   = useState<boolean>(
    typeof window !== 'undefined' && window.innerWidth < MOBILE_BP
  )

  useEffect(() => {
    const handler = () => {
      const nextIsMobile = window.innerWidth < MOBILE_BP
      setIsMobile(nextIsMobile)
      if (nextIsMobile) setMobileOpen(false)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const mainMarginLeft = isMobile ? 0 : 'var(--sidebar-w)'

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <Sidebar
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          onMobileToggle={() => setMobileOpen(v => !v)}
        />
        {isMobile && mobileOpen && (
          <div
            className="fixed inset-0 z-105 bg-(--overlay-backdrop) animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <main
          className="flex flex-1 flex-col min-w-0"
          style={{ marginLeft: mainMarginLeft, transition: 'margin-left 200ms ease' }}
        >
          <div className="flex flex-1 flex-col min-w-0 px-4 pt-3 pb-8 md:px-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
