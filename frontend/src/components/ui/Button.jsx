import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

/** variant: primary | accent | outline | ghost | danger   size: sm | md | lg */
export default function Button({
  variant = 'primary', size = 'md', block, loading, to, className = '', children, disabled,
  icon: Icon, type = 'button', ...rest
}) {
  const cls = ['btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, block && 'btn-block', className]
    .filter(Boolean)
    .join(' ')
  const content = (
    <>
      {loading ? <Loader2 className="spin" size={18} aria-hidden /> : Icon && <Icon size={18} aria-hidden />}
      <span>{children}</span>
    </>
  )
  if (to) return <Link className={cls} to={to} {...rest}>{content}</Link>
  return (
    <button type={type} className={cls} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  )
}
