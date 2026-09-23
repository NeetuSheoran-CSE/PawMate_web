import { Link } from 'react-router-dom'
import { Mail, PawPrint, Phone } from 'lucide-react'
import Logo from '../ui/Logo.jsx'
import { SUPPORT } from '../../data/constants.js'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Logo light />
          <p>
            Busy owners get reliable pet care. Pet lovers get time with animals, and the chance to earn or volunteer.
          </p>
        </div>

        <nav aria-label="Explore">
          <h4>Explore</h4>
          <Link to="/find-walker">Find a Pet Walker</Link>
          <Link to="/become-a-walker">Become a Pet Walker</Link>
          <Link to="/services">Services</Link>
          <Link to="/how-it-works">How It Works</Link>
        </nav>

        <nav aria-label="Company">
          <h4>Company</h4>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact &amp; Help</Link>
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign Up</Link>
        </nav>

        <div>
          <h4>Safety line</h4>
          <a href={`tel:${SUPPORT.safetyLine.replace(/\s/g, '')}`}><Phone size={16} /> {SUPPORT.safetyLine}</a>
          <a href={`mailto:${SUPPORT.email}`}><Mail size={16} /> {SUPPORT.email}</a>
          <span className="footer-note">{SUPPORT.hours}</span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} PawMate. All rights reserved.</span>
        <span className="row gap-sm"><PawPrint size={16} /> Made for pets and the people who love them</span>
      </div>
    </footer>
  )
}
