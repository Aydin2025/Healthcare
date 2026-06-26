import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="container auth-page">
        <div className="auth-card">
          <p className="eyebrow">Almost there</p>
          <h1>Check your email</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 12 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it, then come back and log in.
          </p>
          <Link to="/login" className="btn btn--secondary" style={{ marginTop: 24 }}>Go to Log In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Create your account</p>
        <h1>Sign Up</h1>
        {error && <p className="auth-error">{error}</p>}
        <label>
          Full name
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create Account'}
        </button>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  )
}
