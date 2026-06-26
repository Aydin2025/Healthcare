import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatTimeLabel, formatDateLabel } from '../utils/time'

export default function StaffDashboard() {
  const { profile, session, signOut } = useAuth()
  const [practitionerId, setPractitionerId] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    if (session) init()
  }, [session])

  async function init() {
    setLoading(true)
    const { data: practitionerRow } = await supabase
      .from('practitioners')
      .select('id')
      .eq('profile_id', session.user.id)
      .single()

    if (!practitionerRow) {
      setLoading(false)
      return
    }

    setPractitionerId(practitionerRow.id)

    const { data } = await supabase
      .from('appointments')
      .select('id, appointment_date, start_time, end_time, status, services(name), profiles(full_name)')
      .eq('practitioner_id', practitionerRow.id)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })

    setAppointments(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    setUpdatingId(id)
    await supabase.from('appointments').update({ status }).eq('id', id)
    await init()
    setUpdatingId(null)
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const upcoming = appointments.filter((a) => a.appointment_date >= todayStr && a.status === 'confirmed')
  const past = appointments.filter((a) => a.appointment_date < todayStr || a.status !== 'confirmed')

  return (
    <div className="container" style={{ padding: '56px 0 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="eyebrow">Staff Dashboard</p>
          <h1>Welcome, {profile?.full_name || 'there'}.</h1>
        </div>
        <button className="btn btn--secondary" onClick={signOut}>Log Out</button>
      </div>

      {!loading && !practitionerId && (
        <p style={{ marginTop: 24, color: 'var(--color-coral-dark)' }}>
          No practitioner record found for your account. Add a row in Supabase's
          "practitioners" table with profile_id = your user id.
        </p>
      )}

      <section style={{ marginTop: 40 }}>
        <h3 style={{ marginBottom: 16 }}>Upcoming Appointments</h3>
        {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>}
        {!loading && practitionerId && upcoming.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)' }}>No upcoming appointments.</p>
        )}
        <div className="appt-list">
          {upcoming.map((a) => (
            <div className="appt-card" key={a.id}>
              <div>
                <strong>{a.profiles?.full_name || 'Patient'}</strong>
                <p className="appt-meta">
                  {a.services?.name || 'Visit'} · {formatDateLabel(a.appointment_date)} · {formatTimeLabel(a.start_time)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn--secondary"
                  disabled={updatingId === a.id}
                  onClick={() => updateStatus(a.id, 'completed')}
                >
                  Mark Completed
                </button>
                <button
                  className="btn btn--secondary"
                  disabled={updatingId === a.id}
                  onClick={() => updateStatus(a.id, 'cancelled')}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h3 style={{ marginBottom: 16 }}>Patient Exercise Plans</h3>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Building and assigning exercise plans will be added here in the next step.
        </p>
      </section>

      {past.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h3 style={{ marginBottom: 16 }}>Past</h3>
          <div className="appt-list">
            {past.map((a) => (
              <div className="appt-card appt-card--muted" key={a.id}>
                <div>
                  <strong>{a.profiles?.full_name || 'Patient'}</strong>
                  <p className="appt-meta">
                    {a.services?.name || 'Visit'} · {formatDateLabel(a.appointment_date)} · {formatTimeLabel(a.start_time)}
                  </p>
                </div>
                <span className={`status-badge status-badge--${a.status}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
