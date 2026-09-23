import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, HandHeart, PawPrint, ShieldCheck, Star } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Field from '../components/ui/Field.jsx'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../data/seed.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useForm } from '../hooks/useForm.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { compose, email, password, phone, required, when } from '../utils/validators.js'

const ROLES = [
  { id: 'owner', title: 'Pet owner', text: 'I need help with my pet' },
  { id: 'walker', title: 'Pet walker', text: 'I want to earn or volunteer' },
  { id: 'both', title: 'Both', text: 'I do a bit of each' },
]

const SHOW_DEMO = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO === 'true'

export default function Auth({ mode }) {
  const isLogin = mode === 'login'
  useDocumentTitle(isLogin ? 'Log in' : 'Sign up')
  const { login, signup } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  const [formError, setFormError] = useState('')

  const rules = isLogin
    ? { email: compose(required('Email'), email), password: required('Password') }
    : {
        name: required('Full name'),
        email: compose(required('Email'), email),
        phone: compose(required('Mobile number'), phone),
        city: required('City'),
        password: compose(required('Password'), password),
        confirm: when(() => true, (v, all) => (v === all.password ? '' : 'Passwords do not match')),
        role: required('Role'),
      }
  const form = useForm({ name: '', email: '', phone: '', city: '', password: '', confirm: '', role: 'owner' }, rules)

  const finish = user => {
    toast.success(`Welcome${isLogin ? ' back' : ' to PawMate'}, ${user.name.split(' ')[0]}!`)
    if (from) return navigate(from, { replace: true })
    if (!isLogin && user.role === 'walker') return navigate('/become-a-walker', { replace: true })
    return navigate('/dashboard', { replace: true })
  }

  const submit = async e => {
    e.preventDefault()
    setFormError('')
    if (!form.validate()) return
    setBusy(true)
    try {
      const v = form.values
      const user = isLogin ? await login({ email: v.email, password: v.password }) : await signup(v)
      finish(user)
    } catch (err) {
      setFormError(err.message)
      setBusy(false)
    }
  }

  const demo = async kind => {
    setBusy(true)
    setFormError('')
    try {
      finish(await login({ email: DEMO_ACCOUNTS[kind], password: DEMO_PASSWORD }))
    } catch (err) {
      setFormError(err.message)
      setBusy(false)
    }
  }

  return (
    <section className="auth">
      <div className="container auth-grid">
        <aside className="auth-side">
          <PawPrint size={40} aria-hidden />
          <h2>{isLogin ? 'Welcome back' : 'Join the pack'}</h2>
          <ul>
            <li><ShieldCheck size={20} aria-hidden /> Verified walkers and clear booking details</li>
            <li><Star size={20} aria-hidden /> Honest reviews from real owners</li>
            <li><HandHeart size={20} aria-hidden /> Earn, or volunteer and spend time with pets</li>
          </ul>
        </aside>

        <div className="card auth-card">
          <h1 className="h3">{isLogin ? 'Log in to PawMate' : 'Create your account'}</h1>
          <p className="muted">
            {isLogin ? 'New here? ' : 'Already have an account? '}
            <Link to={isLogin ? '/signup' : '/login'} state={location.state}>{isLogin ? 'Create an account' : 'Log in'}</Link>
          </p>

          {formError && <p className="note note-warn" role="alert">{formError}</p>}

          <form onSubmit={submit} noValidate className="stack">
            {!isLogin && (
              <fieldset className="role-picker">
                <legend>I am a</legend>
                {ROLES.map(r => (
                  <label key={r.id} className={`role ${form.values.role === r.id ? 'role-on' : ''}`}>
                    <input type="radio" name="role" value={r.id} checked={form.values.role === r.id} onChange={form.handleChange} />
                    <strong>{r.title}</strong>
                    <span>{r.text}</span>
                  </label>
                ))}
              </fieldset>
            )}

            {!isLogin && <Field label="Full name" required autoComplete="name" {...form.field('name')} />}
            <Field label="Email" required type="email" autoComplete="email" {...form.field('email')} />
            {!isLogin && (
              <div className="form-grid">
                <Field label="Mobile number" required inputMode="tel" autoComplete="tel" placeholder="98765 43210" {...form.field('phone')} />
                <Field label="City" required autoComplete="address-level2" placeholder="Gurugram" {...form.field('city')} />
              </div>
            )}

            <div className="field-with-toggle">
              <Field
                label="Password" required type={show ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'}
                hint={isLogin ? undefined : 'At least 8 characters, with a letter and a number.'}
                {...form.field('password')}
              />
              <button type="button" className="icon-btn eye" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(s => !s)}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {!isLogin && <Field label="Confirm password" required type={show ? 'text' : 'password'} autoComplete="new-password" {...form.field('confirm')} />}

            <Button type="submit" size="lg" block loading={busy}>{isLogin ? 'Log in' : 'Create account'}</Button>
          </form>

          {isLogin && SHOW_DEMO && (
            <div className="demo-box">
              <p><strong>Trying the demo?</strong> Sign in with a sample account:</p>
              <div className="row gap-sm wrap">
                <Button variant="outline" size="sm" onClick={() => demo('owner')} disabled={busy}>Demo pet owner</Button>
                <Button variant="outline" size="sm" onClick={() => demo('walker')} disabled={busy}>Demo pet walker</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
