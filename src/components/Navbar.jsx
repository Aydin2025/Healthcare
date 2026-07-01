import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// NOTE: "Riverside Physio" is a placeholder name — replace with the
// real clinic name once decided.
export default function Navbar() {
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const linkClass = ({ isActive }) =>
    isActive ? 'navbar__link navbar__link--active' : 'navbar__link'

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  const isStaff = profile?.role === 'practitioner' || profile?.role === 'admin'
  const dashboardPath = isStaff ? '/staff' : '/dashboard'

  return (
    <header className="navbar">
      <Link to="/" className="navbar__logo">
        Riverside Physio <span className="navbar__logo-mark">+</span>
      </Link>
      <nav className="navbar__links">
        <NavLink to="/" end className={linkClass}>Home</NavLink>
        <NavLink to="/services" className={linkClass}>Services</NavLink>
        <NavLink to="/team" className={linkClass}>Our Team</NavLink>

        {session ? (
          <>
            <NavLink to={dashboardPath} className={linkClass}>Dashboard</NavLink>
            {profile?.role === 'admin' && (
              <NavLink to="/admin" className={linkClass}>Admin</NavLink>
            )}
            <button onClick={handleLogout} className="navbar__link" style={{ background: 'none', border: 'none' }}>
              Log Out
            </button>
          </>
        ) : (
          <NavLink to="/login" className={linkClass}>Log In</NavLink>
        )}

        {!isStaff && <Link to="/book" className="navbar__cta">Book a Visit</Link>}
      </nav>
    </header>
  )
}
