import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const links = [
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/clinic', label: 'Clinic Settings' },
  { to: '/admin/services', label: 'Services' },
  { to: '/admin/availability', label: 'Availability' },
]

export default function AdminLayout() {
  const { profile, loading } = useAuth()

  if (loading) return <div className="container" style={{ paddingTop: 80 }}>Loading…</div>
  if (!profile || profile.role !== 'admin') return <Navigate to="/" replace />

  return (
    <div className="admin-layout container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <p className="eyebrow">Admin</p>
      <h1 style={{ marginBottom: 28 }}>Admin Panel</h1>
      <div className="admin-shell">
        <nav className="admin-nav">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? 'admin-nav__link admin-nav__link--active' : 'admin-nav__link'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
