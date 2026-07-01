import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

const empty = { name: '', description: '', duration_minutes: 30, price_cents: '', active: true }

export default function AdminServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadServices() }, [])

  async function loadServices() {
    setLoading(true)
    const { data } = await supabase.from('services').select('*').order('name')
    setServices(data || [])
    setLoading(false)
  }

  function startEdit(service) {
    setEditingId(service.id)
    setForm({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price_cents: service.price_cents ? (service.price_cents / 100).toFixed(2) : '',
      active: service.active,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(empty)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name: form.name,
      description: form.description,
      duration_minutes: Number(form.duration_minutes),
      price_cents: form.price_cents ? Math.round(parseFloat(form.price_cents) * 100) : null,
      active: form.active,
    }

    let dbError
    if (editingId) {
      const { error } = await supabase.from('services').update(payload).eq('id', editingId)
      dbError = error
    } else {
      const { error } = await supabase.from('services').insert(payload)
      dbError = error
    }

    setSaving(false)
    if (dbError) { setError(dbError.message); return }

    setSuccess(editingId ? 'Service updated.' : 'Service added.')
    setTimeout(() => setSuccess(''), 3000)
    cancelEdit()
    loadServices()
  }

  async function toggleActive(service) {
    await supabase.from('services').update({ active: !service.active }).eq('id', service.id)
    loadServices()
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Services</h2>
      {error && <p className="auth-error" style={{ marginBottom: 12 }}>{error}</p>}
      {success && <p className="status-badge status-badge--completed" style={{ display: 'inline-block', marginBottom: 12 }}>{success}</p>}

      <form className="auth-card" style={{ maxWidth: 480, marginBottom: 32 }} onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit service' : 'Add a service'}</h3>
        <label>Name<input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label>Description<input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label>Duration (minutes)<input type="number" min="5" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} required /></label>
        <label>Price ($) <span style={{ fontWeight: 400 }}>— leave blank for no online payment step</span>
          <input type="number" min="0" step="0.01" value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: e.target.value })} placeholder="e.g. 90.00" />
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update' : 'Add Service'}</button>
          {editingId && <button className="btn btn--secondary" type="button" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Duration</th><th>Price</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong><p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.description}</p></td>
                <td>{s.duration_minutes} min</td>
                <td>{s.price_cents ? `$${(s.price_cents / 100).toFixed(2)}` : '—'}</td>
                <td><span className={`status-badge ${s.active ? 'status-badge--completed' : ''}`}>{s.active ? 'active' : 'inactive'}</span></td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn--secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => startEdit(s)}>Edit</button>
                  <button className="btn btn--secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => toggleActive(s)}>{s.active ? 'Deactivate' : 'Activate'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
