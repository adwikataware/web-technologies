import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/catalogue', label: 'Catalogue', end: false }
]

export default function NavBar() {
  const { account, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  const handleSignOut = async () => {
    close()
    await signOut()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-mark" aria-hidden="true">P&amp;P</span>
          <span className="brand-name">Pages &amp; Prints</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>

        <nav className={`nav-links${open ? ' is-open' : ''}`}>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
              onClick={close}
            >
              {link.label}
            </NavLink>
          ))}

          {account ? (
            <div className="nav-account">
              <span className="nav-greeting">
                Hi, {account.fullName.split(' ')[0]}
              </span>
              <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          ) : (
            <div className="nav-account">
              <NavLink to="/login" className="btn btn-ghost" onClick={close}>
                Login
              </NavLink>
              <NavLink to="/register" className="btn btn-primary" onClick={close}>
                Register
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
