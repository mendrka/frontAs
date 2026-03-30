import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from '@components/navbar/Navbar'
import { useOffline } from '@hooks/useOffline'
import BottomNav from '@components/BottomNav'
import Icon from '@components/ui/Icon'
import { cx } from '@utils/ui'

// Pages sans padding (full-width)
const FULL_WIDTH_PAGES = ['/sprechen', '/communaute']

function MainLayout() {
  const { isOnline, showReconnected } = useOffline()
  const location = useLocation()
  const isFullWidth = FULL_WIDTH_PAGES.some((p) => location.pathname.startsWith(p))

  // Remonter en haut a chaque changement de page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  const bannerClasses =
    'fixed inset-x-4 top-4 z-[70] flex items-center justify-center gap-2 rounded-full border border-brand-border/80 bg-white/90 px-4 py-3 text-sm font-semibold text-brand-text shadow-soft backdrop-blur sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2'

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute left-[-5rem] top-[4.5rem] h-52 w-52 rounded-full bg-brand-sky/40 blur-3xl sm:left-[-7rem] sm:top-[5rem] sm:h-72 sm:w-72" />
        <div className="absolute right-[-4rem] top-[18vh] h-44 w-44 rounded-full bg-emerald-200/60 blur-3xl sm:right-[-6rem] sm:h-64 sm:w-64" />
        <div className="absolute bottom-0 left-1/2 h-60 w-[28rem] -translate-x-1/2 rounded-full bg-sky-100/60 blur-3xl sm:h-80 sm:w-[42rem]" />
        <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(255,255,255,0.64),transparent)]" />
      </div>

      {!isOnline && (
        <div className={cx(bannerClasses, 'border-amber-200 bg-amber-50/95 text-amber-700')} role="alert" aria-live="polite">
          <Icon name="wifiOff" size={18} className="icon" />
          <span>Keine Verbindung - Mode hors ligne</span>
        </div>
      )}

      {showReconnected && (
        <div className={cx(bannerClasses, 'border-emerald-200 bg-emerald-50/95 text-emerald-700')} role="status" aria-live="polite">
          <Icon name="checkCircle" size={18} className="icon" />
          <span>Verbindung wiederhergestellt - Reconnecté</span>
        </div>
      )}

      <Navbar />

      <main
        className={cx(
          'relative min-h-[calc(100vh-8rem)] pt-20 md:pt-24',
          isFullWidth ? 'pb-24 md:pb-12' : 'pb-28 md:pb-14'
        )}
        id="main-content"
      >
        {isFullWidth ? (
          <Outlet />
        ) : (
          <div className="page-section">
            <Outlet />
          </div>
        )}
      </main>

      <BottomNav />

      <footer
        className={cx(
          'border-t border-brand-border/60 bg-white/55 pb-24 pt-6 backdrop-blur-xl md:pb-10',
          isFullWidth && 'hidden md:block'
        )}
      >
        <div className="shell flex flex-col gap-3 text-sm text-brand-brown sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-brand-text">
            &copy; {new Date().getFullYear()} EAM - Ecole d&apos;Allemand pour Malgaches
          </p>
          <p className="hidden text-brand-brown/85 sm:block">
            Concu pour apprendre l&apos;allemand avec une interface mobile claire, utile et rapide.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default MainLayout

