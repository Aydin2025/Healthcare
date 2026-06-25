import { NavLink, Link } from 'react-router-dom'

// NOTE: "Riverside Physio" is a placeholder name — replace with the
// real clinic name once decided.
export default function Navbar() {
  const linkClass = ({ isActive }) =>
    isActive ? 'navbar__link navbar__link--active' : 'navbar__link'

  return (
    <header className="navbar">
      <Link to="/" className="navbar__logo">
        Riverside Physio <span className="navbar__logo-mark">+</span>
      </Link>
      <nav className="navbar__links">
        <NavLink to="/" end className={linkClass}>Home</NavLink>
        <NavLink to="/services" className={linkClass}>Services</NavLink>
        <NavLink to="/team" className={linkClass}>Our Team</NavLink>
        <NavLink to="/login" className={linkClass}>Log In</NavLink>
        <Link to="/book" className="navbar__cta">Book a Visit</Link>
      </nav>
    </header>
  )
}
