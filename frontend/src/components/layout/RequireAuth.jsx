import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Spinner from '../ui/Spinner.jsx'

/** Wrap a page to require login. Pass `roles` to also restrict by role. */
export default function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}
