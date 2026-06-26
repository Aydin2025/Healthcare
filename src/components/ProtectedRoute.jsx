import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Wrap a route's element in this to require login, and optionally
// restrict it to specific roles, e.g. allowedRoles={['practitioner', 'admin']}
export default function ProtectedRoute({ children, allowedRoles }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        Loading…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
