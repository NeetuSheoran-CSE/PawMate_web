import { useState } from 'react'
import { initials } from '../../utils/format.js'

const PALETTE = [
  ['#2D6A4F', '#CFE6D6'],
  ['#B85F1B', '#FFE3BF'],
  ['#5C7A1F', '#E2EDC4'],
  ['#9A4E2B', '#F6D9C8'],
  ['#2F6F7E', '#D3EAF0'],
  ['#6E4FA0', '#E5DBF3'],
]

export default function Avatar({ name = '?', photo, size = 48, tone = 0 }) {
  const [broken, setBroken] = useState(false)
  const [fg, bg] = PALETTE[tone % PALETTE.length]
  const style = { width: size, height: size, fontSize: size * 0.38, background: bg, color: fg }
  if (photo && !broken) {
    return <img className="avatar" src={photo} alt={name} style={style} onError={() => setBroken(true)} />
  }
  return <span className="avatar" style={style} aria-hidden>{initials(name)}</span>
}
