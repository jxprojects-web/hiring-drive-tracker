import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AppRole } from '../types'

export function ProtectedRoute({ children, allowRoles }: { children: ReactNode; allowRoles?: AppRole[] }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">Loading…</div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (allowRoles && profile && !allowRoles.includes(profile.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        You don't have access to this page.
      </div>
    )
  }

  return <>{children}</>
}
