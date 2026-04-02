import { Navigate } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import PageLoader from '@components/PageLoader'

function AdminRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />

  return children
}

export default AdminRoute
