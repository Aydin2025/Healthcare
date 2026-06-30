import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function ProfileSettings() {
  const { profile, session, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Practitioner-only fields
  const [isPractitioner, setIsPractitioner] = useState(false)
  const [specialty, setSpecialty] = useState('')
  const [bio, setBio] = useState('')
  const [title, setTitle] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [practitionerId, setPractitionerId] = useState(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      if (profile.role === 'practitioner' || profile.role === 'admin') {
        setIsPractitioner(true)
        loadPractitionerDetails()
      }
    }
  }, [profile])

  async function loadPractitionerDetails() {
    const { data } = await supabase
      .from('practitioners')
      .select('id, specialty, bio, title, registration_number')
      .eq('profile_id', session.user.id)
      .single()

    if (data) {
      setPractitionerId(data.id)
      setSpecialty(data.specialty || '')
      setBio(data.bio || '')
      setTitle(data.title || '')
      setRegistrationNumber(data.registration_number || '')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', session.user.id)

    if (profileError) {
      setError(profileError.message)
      setSaving(false)
      return
    }

    if (isPractitioner && practitionerId) {
      const { error: practError } = await supabase
        .from('practitioners')
        .update({
          specialty,
          bio,
          title,
          registration_number: registrationNumber,
        })
        .eq('id', practitionerId)

      if (practError) {
        setError(practError.message)
        setSaving(false)
        return
      }
    }

    await refreshProfile()
    setSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 4000)
  }

  const backPath = isPractitioner ? '/staff' : '/dashboard'

  return (
    <div className="container" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <p className="eyebrow">
        <Link to={backPath} style={{ color: 'var(--color-primary)' }}>← Back to Dashboard</Link>
      </p>
      <h1 style={{ margin: '8px 0 28px' }}>Profile Settings</h1>

      <form className="auth-card" style={{ maxWidth: 520 }} onSubmit={handleSubmit}>
        {error && <p className="auth-error">{error}</p>}
        {success && (
          <p className="status-badge status-badge--completed" style={{ display: 'inline-block' }}>
            Profile updated successfully.
          </p>
        )}

        <h3>Personal info</h3>
        <label>
          Full name
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Phone number
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. (613) 555-0123" />
        </label>

        {isPractitioner && (
          <>
            <h3 style={{ marginTop: 8 }}>Professional details</h3>
            <label>
              Professional title
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Registered Physiotherapist" />
            </label>
            <label>
              Registration / licence number
              <input type="text" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="e.g. College of Physiotherapists #" />
            </label>
            <label>
              Specialty
              <input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="e.g. Sports Rehabilitation" />
            </label>
            <label>
              Bio <span style={{ fontWeight: 400 }}>(shown on the Our Team page)</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                style={{ fontFamily: 'inherit', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', resize: 'vertical', fontSize: '1rem' }}
                placeholder="A short paragraph about your background and approach..."
              />
            </label>
          </>
        )}

        <button className="btn btn--primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
