import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import type { FieldErrors } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import Field from '../components/Field'

/** The same rules the server enforces, so the form can say so immediately. */
const RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains a letter', test: (p: string) => /[A-Za-z]/.test(p) },
  { label: 'Contains a digit', test: (p: string) => /\d/.test(p) }
]

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const strength = useMemo(() => RULES.filter((r) => r.test(password)).length, [password])

  const validate = (): FieldErrors => {
    const found: FieldErrors = {}

    if (!fullName.trim()) found.fullName = 'Full name is required'
    else if (fullName.trim().length < 2) {
      found.fullName = 'Full name must be between 2 and 80 characters'
    }

    if (!email.trim()) found.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      found.email = 'Enter a valid email address'
    }

    const failed = RULES.find((rule) => !rule.test(password))
    if (!password) found.password = 'Password is required'
    else if (failed) found.password = failed.label

    // Confirmation is a browser-side idea; the API never sees this field.
    if (!confirm) found.confirm = 'Please repeat the password'
    else if (confirm !== password) found.confirm = 'Passwords do not match'

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
      await register(fullName, email, password)
      navigate('/catalogue', { replace: true })
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
        <h1>Create your account</h1>
        <p className="auth-sub">It takes a minute, and nothing is charged today.</p>

        {message && <p className="alert alert-error" role="alert">{message}</p>}

        <form onSubmit={submit} noValidate>
          <Field
            id="reg-name"
            label="Full name"
            autoComplete="name"
            placeholder="Adwika Taware"
            value={fullName}
            error={errors.fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Field
            id="reg-email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            hint="Used to sign in and for order updates."
            value={email}
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            id="reg-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <ul className="rules" aria-label="Password requirements">
            {RULES.map((rule) => {
              const met = rule.test(password)
              return (
                <li key={rule.label} className={met ? 'is-met' : ''}>
                  <span aria-hidden="true">{met ? '✓' : '○'}</span> {rule.label}
                </li>
              )
            })}
          </ul>
          <div className="strength" aria-hidden="true">
            <span className={`strength-bar strength-${strength}`} />
          </div>

          <Field
            id="reg-confirm"
            label="Repeat password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            error={errors.confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in instead</Link>
        </p>
      </div>

      <aside className="auth-aside">
        <h2>What we store</h2>
        <p>
          Your name, your email and a BCrypt hash of your password. The password
          itself is never written down, not even in the server log.
        </p>
        <p className="aside-note">
          The account is saved to the <code>users</code> collection in MongoDB,
          with a unique index on the email address.
        </p>
      </aside>
    </section>
  )
}
