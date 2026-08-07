import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS, ROLE_OWNED_STAGE, STAGE_LABELS } from '../types'
import { ReactNode } from 'react'
import clsx from 'clsx'

export function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const ownedStage = profile ? ROLE_OWNED_STAGE[profile.role] : undefined

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const navItem = (to: string, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-white text-brand' : 'text-white/80 hover:bg-white/10 hover:text-white'
        )
      }
    >
      {label}
    </NavLink>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-white">Hiring Drive Tracker</span>
            <nav className="flex gap-1">
              {navItem('/', 'Dashboard')}
              {ownedStage && navItem(`/stage/${ownedStage}`, `My Queue (${STAGE_LABELS[ownedStage]})`)}
              {profile?.role === 'admin' && navItem('/admin', 'Admin')}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/90">
            <span>
              {profile?.full_name || profile?.email} · {profile ? ROLE_LABELS[profile.role] : ''}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-md bg-white/10 px-3 py-1.5 font-medium hover:bg-white/20"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}
