import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Menu, MessageCircle, User, X } from 'lucide-react'
import Logo from '../ui/Logo.jsx'
import Button from '../ui/Button.jsx'
import Avatar from '../ui/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

const LINKS = [
  ['/find-walker', 'Find a Walker'],
  ['/become-a-walker', 'Become a Walker'],
  ['/services', 'Services'],
  ['/how-it-works', 'How It Works'],
  ['/about', 'About'],
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => { setOpen(false); setMenu(false) }, [pathname])

  useEffect(() => {
    const onDoc = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const onLogout = async () => {
    await logout()
    toast.info('You have been logged out.')
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Logo />

        <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Main">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {label}
            </NavLink>
          ))}

          <div className="nav-auth-mobile">
            {user ? (
              <>
                <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
                <NavLink to="/messages" className="nav-link">Messages</NavLink>
                <NavLink to="/profile" className="nav-link">My profile</NavLink>
                <button className="nav-link nav-link-btn" onClick={onLogout}>Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="nav-link">Login</NavLink>
                <Button to="/signup" block>Get Started</Button>
              </>
            )}
          </div>
        </nav>

        <div className="nav-actions">
          {user ? (
            <div className="user-menu" ref={menuRef}>
              <button className="user-btn" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(m => !m)}>
                <Avatar name={user.name} size={36} tone={user.name.length} />
                <span className="user-name">{user.name.split(' ')[0]}</span>
              </button>
              {menu && (
                <div className="dropdown" role="menu">
                  <NavLink to="/dashboard" role="menuitem"><LayoutDashboard size={18} /> Dashboard</NavLink>
                  <NavLink to="/messages" role="menuitem"><MessageCircle size={18} /> Messages</NavLink>
                  <NavLink to="/profile" role="menuitem"><User size={18} /> My profile</NavLink>
                  <button role="menuitem" onClick={onLogout}><LogOut size={18} /> Log out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/login" className="nav-link nav-login">Login</NavLink>
              <Button to="/signup" size="sm" className="nav-cta">Get Started</Button>
            </>
          )}
          <button
            className="icon-btn nav-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  )
}
