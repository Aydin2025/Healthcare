import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setSubmitting(false)
      setError(error.message)
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    setSubmitting(false)

    if (profileData?.role === 'practitioner' || profileData?.role === 'admin') {
      navigate('/staff')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="container auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Welcome back</p>
        <h1>Log In</h1>
        {error && <p className="auth-error">{error}</p>}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log In'}
        </button>
        <p className="auth-switch">Don't have an account? <Link to="/signup">Sign up</Link></p>
      </form>
    </div>
  )
}
