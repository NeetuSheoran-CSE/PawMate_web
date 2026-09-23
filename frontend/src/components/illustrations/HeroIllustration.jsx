/** A friendly hand-drawn style dog, drawn with plain SVG shapes. */
export default function HeroIllustration() {
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label="A happy golden dog wearing a green collar" className="hero-dog">
      <circle cx="200" cy="205" r="176" fill="#DDEBD9" />
      <circle cx="318" cy="88" r="26" fill="#FFE3BF" />
      <g fill="#2D6A4F" opacity=".14">
        <ellipse cx="72" cy="318" rx="13" ry="10" />
        <circle cx="54" cy="300" r="5" /><circle cx="68" cy="290" r="5" /><circle cx="84" cy="292" r="5" /><circle cx="94" cy="304" r="5" />
      </g>
      <path d="M96 150c-40 22-42 100-6 138 34-14 50-72 46-128z" fill="#B57B3C" />
      <path d="M304 150c40 22 42 100 6 138-34-14-50-72-46-128z" fill="#B57B3C" />
      <ellipse cx="200" cy="196" rx="102" ry="100" fill="#EDB86F" />
      <path d="M200 100c-18 0-30 22-30 44 0 10 8 16 30 16s30-6 30-16c0-22-12-44-30-44z" fill="#F6CE94" />
      <ellipse cx="200" cy="240" rx="58" ry="44" fill="#FBE9C8" />
      <ellipse cx="200" cy="218" rx="21" ry="15" fill="#2B2724" />
      <ellipse cx="193" cy="213" rx="6" ry="3.5" fill="#fff" opacity=".55" />
      <path d="M200 232v14m0 0c-10 14-25 12-29 1m29-1c10 14 25 12 29 1" stroke="#2B2724" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M189 256c0 26 22 26 22 0z" fill="#F0808F" />
      <circle cx="162" cy="176" r="11" fill="#2B2724" /><circle cx="238" cy="176" r="11" fill="#2B2724" />
      <circle cx="166" cy="172" r="3.6" fill="#fff" /><circle cx="242" cy="172" r="3.6" fill="#fff" />
      <path d="M143 152c9-7 20-8 28-3M257 152c-9-7-20-8-28-3" stroke="#B57B3C" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M118 282c42 30 122 30 164 0l8 20c-48 34-132 34-180 0z" fill="#2D6A4F" />
      <circle cx="200" cy="322" r="15" fill="#E8853A" />
      <path d="M200 330c-5-3-8-6-8-10a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 4-3 7-8 10z" fill="#fff" />
    </svg>
  )
}
