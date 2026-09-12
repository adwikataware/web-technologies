import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import type { FieldErrors } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import Field from '../components/Field'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Where the catalogue sent us from, if it bounced us here.
  const from = (location.state as { from?: string } | null)?.from ?? '/catalogue'

  /** Checked before the request so an obvious slip does not need a round trip. */
  const validate = (): FieldErrors => {
    const found: FieldErrors = {}
    if (!email.trim()) found.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      found.email = 'Enter a valid email address'
    }
    if (!password) found.password = 'Password is required'
    return found
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)

    const local = validate()
    setErrors(local)
    if (Object.keys(local).length > 0) return

    setBusy(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors)
        setMessage(error.message)
      } else {
        setMessage('Something went wrong. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-sub">Sign in to see your orders and saved titles.</p>

        {message && <p className="alert alert-error" role="alert">{message}</p>}

        <form onSubmit={submit} noValidate>
          <Field
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>

      <aside className="auth-aside">
        <h2>Why sign in?</h2>
        <ul>
          <li>Keep a reading list across devices</li>
          <li>Track orders and past invoices</li>
          <li>Get told when a sold-out title is back</li>
        </ul>
      </aside>
    </section>
  )
}
