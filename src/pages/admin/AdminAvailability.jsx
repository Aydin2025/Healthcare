import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function AdminAvailability() {
  const [practitioners, setPractitioners] = useState([])
  const [selectedPractId, setSelectedPractId] = useState('')
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state for adding a new slot
  const [newSlot, setNewSlot] = useState({ day_of_week: 1, start_time: '09:00', end_time: '17:00' })

  useEffect(() => { loadPractitioners() }, [])
  useEffect(() => { if (selectedPractId) loadAvailability(selectedPractId) }, [selectedPractId])

  async function loadPractitioners() {
    const { data } = await supabase
      .from('practitioners')
      .select('id, profiles(full_name)')
      .eq('active', true)
    setPractitioners(data || [])
    if (data?.length > 0) setSelectedPractId(data[0].id)
  }

  async function loadAvailability(practId) {
    setLoading(true)
    const { data } = await supabase
      .from('availability')
      .select('*')
      .eq('practitioner_id', practId)
      .order('day_of_week')
    setAvailability(data || [])
    setLoading(false)
  }

  async function addSlot(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error } = await supabase.from('availability').insert({
      practitioner_id: selectedPractId,
      day_of_week: Number(newSlot.day_of_week),
      start_time: newSlot.start_time,
      end_time: newSlot.end_time,
    })

    setSaving(false)
    if (error) { setError(error.message); return }
    setSuccess('Availability added.')
    setTimeout(() => setSuccess(''), 3000)
    loadAvailability(selectedPractId)
  }

  async function deleteSlot(id) {
    await supabase.from('availability').delete().eq('id', id)
    loadAvailability(selectedPractId)
  }

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Availability</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Set the weekly working hours per practitioner. These determine what time slots patients can book.
      </p>

      {error && <p className="auth-error" style={{ marginBottom: 12 }}>{error}</p>}
      {success && <p className="status-badge status-badge--completed" style={{ display: 'inline-block', marginBottom: 12 }}>{success}</p>}

      <label style={{ display: 'block', marginBottom: 20, maxWidth: 280 }}>
        Practitioner
        <select
          value={selectedPractId}
          onChange={(e) => setSelectedPractId(e.target.value)}
          className="admin-select"
          style={{ display: 'block', marginTop: 6, width: '100%' }}
        >
          {practitioners.map((p) => (
            <option key={p.id} value={p.id}>{p.profiles?.full_name || 'Unnamed'}</option>
          ))}
        </select>
      </label>

      {selectedPractId && (
        <>
          <form className="auth-card" style={{ maxWidth: 420, marginBottom: 28 }} onSubmit={addSlot}>
            <h3>Add working hours</h3>
            <label>
              Day
              <select value={newSlot.day_of_week} onChange={(e) => setNewSlot({ ...newSlot, day_of_week: e.target.value })} className="admin-select">
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </label>
            <label>Start time<input type="time" value={newSlot.start_time} onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })} required /></label>
            <label>End time<input type="time" value={newSlot.end_time} onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })} required /></label>
            <button className="btn btn--primary" type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add'}</button>
          </form>

          {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Day</th><th>Start</th><th>End</th><th></th></tr></thead>
              <tbody>
                {availability.map((a) => (
                  <tr key={a.id}>
                    <td>{DAYS[a.day_of_week]}</td>
                    <td>{a.start_time.slice(0, 5)}</td>
                    <td>{a.end_time.slice(0, 5)}</td>
                    <td>
                      <button
                        className="btn btn--secondary"
                        style={{ fontSize: '0.8rem', padding: '5px 10px', color: 'var(--color-coral-dark)' }}
                        onClick={() => deleteSlot(a.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {availability.length === 0 && !loading && (
                  <tr><td colSpan={4} style={{ color: 'var(--color-text-muted)' }}>No working hours set yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
