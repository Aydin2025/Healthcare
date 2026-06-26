import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatTimeLabel, formatDateLabel } from '../utils/time'

export default function PatientDashboard() {
  const { profile, session, signOut } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)

  useEffect(() => {
    if (session) loadAppointments()
  }, [session])

  async function loadAppointments() {
    setLoading(true)
    const { data } = await supabase
      .from('appointments')
      .select('id, appointment_date, start_time, end_time, status, services(name), practitioners(specialty, profiles(full_name))')
      .eq('patient_id', session.user.id)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })

    setAppointments(data || [])
    setLoading(false)
  }

  async function cancelAppointment(id) {
    setCancellingId(id)
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
    await loadAppointments()
    setCancellingId(null)
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const upcoming = appointments.filter((a) => a.appointment_date >= todayStr && a.status !== 'cancelled')
  const past = appointments.filter((a) => a.appointment_date < todayStr || a.status === 'cancelled')

  return (
    <div className="container" style={{ padding: '56px 0 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="eyebrow">Patient Dashboard</p>
          <h1>Welcome, {profile?.full_name || 'there'}.</h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/book" className="btn btn--primary">Book a Visit</Link>
          <button className="btn btn--secondary" onClick={signOut}>Log Out</button>
        </div>
      </div>

      <section style={{ marginTop: 40 }}>
        <h3 style={{ marginBottom: 16 }}>Upcoming Appointments</h3>
        {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>}
        {!loading && upcoming.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)' }}>No upcoming appointments yet.</p>
        )}
        <div className="appt-list">
          {upcoming.map((a) => (
            <div className="appt-card" key={a.id}>
              <div>
                <strong>{a.services?.name || 'Visit'}</strong>
                <p className="appt-meta">
                  {formatDateLabel(a.appointment_date)} · {formatTimeLabel(a.start_time)} with{' '}
                  {a.practitioners?.profiles?.full_name || 'your practitioner'}
                </p>
              </div>
              <button
                className="btn btn--secondary"
                disabled={cancellingId === a.id}
                onClick={() => cancelAppointment(a.id)}
              >
                {cancellingId === a.id ? 'Cancelling…' : 'Cancel'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h3 style={{ marginBottom: 16 }}>Exercise Plan</h3>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Your assigned exercises and progress log will appear here in the next step.
        </p>
      </section>

      {past.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h3 style={{ marginBottom: 16 }}>Past & Cancelled</h3>
          <div className="appt-list">
            {past.map((a) => (
              <div className="appt-card appt-card--muted" key={a.id}>
                <div>
                  <strong>{a.services?.name || 'Visit'}</strong>
                  <p className="appt-meta">
                    {formatDateLabel(a.appointment_date)} · {formatTimeLabel(a.start_time)}
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
