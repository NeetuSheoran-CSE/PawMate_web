import { Link } from 'react-router-dom'
import { PawPrint } from 'lucide-react'

export default function Logo({ light = false }) {
  return (
    <Link to="/" className={`logo ${light ? 'logo-light' : ''}`} aria-label="PawMate home">
      <span className="logo-mark"><PawPrint size={22} aria-hidden /></span>
      <span className="logo-word">PawMate</span>
    </Link>
  )
}
