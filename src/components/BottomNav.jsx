import { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { useLang } from '@context/LangContext'
import Icon from '@components/ui/Icon'
import { cx } from '@utils/ui'

const ITEMS = [
  { to: '/dashboard', icon: 'home', label: { de: 'Start', fr: 'Accueil' } },
  { to: '/cours', icon: 'book', label: { de: 'Kurse', fr: 'Cours' } },
  { to: '/sprechen', icon: 'mic', label: { de: 'Sprechen', fr: 'Oral' } },
  { to: '/communaute', icon: 'messageCircle', label: { de: 'Chat', fr: 'Chat' } },
]

function BottomNav() {
  const { user } = useAuth()
  const { t } = useLang()
  const location = useLocation()

  const hide = useMemo(() => {
    return ['/sprechen', '/communaute'].some((path) => location.pathname.startsWith(path))
  }, [location.pathname])

  if (!user || hide) return null

  return (
    <nav className="safe-bottom fixed inset-x-2.5 bottom-2 z-40 md:hidden" aria-label={t('Navigation', 'Navigation')}>
      <div className="mx-auto flex max-w-md items-stretch gap-1 rounded-[1.75rem] border border-white/75 bg-white/85 p-1.5 shadow-[0_24px_60px_-36px_rgba(53,94,75,0.38)] backdrop-blur-2xl sm:rounded-[2rem] sm:p-2">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cx(
                'group relative flex min-w-0 flex-1 flex-col items-center justify-center rounded-[1.2rem] px-1.5 py-2 text-center transition duration-300 focus:outline-none focus:ring-4 focus:ring-brand-blue/15 sm:rounded-[1.5rem] sm:px-2 sm:py-2.5',
                isActive
                  ? 'bg-gradient-to-b from-brand-blue to-brand-blueDeep text-white shadow-soft'
                  : 'text-brand-brown hover:bg-white/90 hover:text-brand-text'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cx(
                    'absolute inset-x-4 top-1 h-px rounded-full transition duration-300',
                    isActive ? 'bg-white/70' : 'bg-transparent'
                  )}
                  aria-hidden="true"
                />

                <span
                  className={cx(
                    'flex h-9 w-9 items-center justify-center rounded-[0.9rem] border transition duration-300 sm:h-10 sm:w-10 sm:rounded-[1rem]',
                    isActive
                      ? 'border-white/20 bg-white/15 text-white'
                      : 'border-white/80 bg-brand-sky/85 text-brand-blueDeep group-hover:bg-white'
                  )}
                  aria-hidden="true"
                >
                  <Icon name={item.icon} size={18} className="icon" />
                </span>

                <span className="mt-1.5 max-w-full truncate px-0.5 text-[9px] font-bold uppercase tracking-[0.16em] sm:text-[10px] sm:tracking-[0.22em]">
                  {t(item.label)}
                </span>

                <span
                  className={cx(
                    'mt-1 h-1.5 rounded-full transition-all duration-300',
                    isActive ? 'w-6 bg-white/80' : 'w-2 bg-current/40 group-hover:bg-brand-blue/45'
                  )}
                  aria-hidden="true"
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNav
