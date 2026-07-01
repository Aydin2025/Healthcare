import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function AdminClinic() {
  const [form, setForm] = useState({
    clinic_name: '', address: '', phone: '', email: '', business_number: '',
  })
  const [settingsId, setSettingsId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    setLoading(true)
    const { data } = await supabase.from('clinic_settings').select('*').limit(1).maybeSingle()
    if (data) {
      setSettingsId(data.id)
      setForm({
        clinic_name: data.clinic_name || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        business_number: data.business_number || '',
      })
    }
    setLoading(false)
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    let dbError
    if (settingsId) {
      const { error } = await supabase.from('clinic_settings').update({ ...form, updated_at: new Date().toISOString() }).eq('id', settingsId)
      dbError = error
    } else {
      const { data, error } = await supabase.from('clinic_settings').insert(form).select().single()
      if (data) setSettingsId(data.id)
      dbError = error
    }

    setSaving(false)
    if (dbError) { setError(dbError.message); return }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 4000)
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Clinic Settings</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
        This information appears on every patient receipt. Keep it accurate.
      </p>
      <form className="auth-card" style={{ maxWidth: 480 }} onSubmit={handleSubmit}>
        {error && <p className="auth-error">{error}</p>}
        {success && <p className="status-badge status-badge--completed" style={{ display: 'inline-block' }}>Saved.</p>}
        {[
          { field: 'clinic_name', label: 'Clinic name' },
          { field: 'address', label: 'Full address' },
          { field: 'phone', label: 'Phone number' },
          { field: 'email', label: 'Contact email' },
          { field: 'business_number', label: 'GST/HST number' },
        ].map(({ field, label }) => (
          <label key={field}>
            {label}
            <input type="text" value={form[field]} onChange={(e) => update(field, e.target.value)} />
          </label>
        ))}
        <button className="btn btn--primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
