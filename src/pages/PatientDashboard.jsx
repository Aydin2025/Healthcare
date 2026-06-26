import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatTimeLabel, formatDateLabel } from '../utils/time'

export default function PatientDashboard() {
  const { profile, session, signOut } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [plans, setPlans] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)

  const [logForms, setLogForms] = useState({})
  const [savingLogId, setSavingLogId] = useState(null)

  useEffect(() => {
    if (session) loadAll()
  }, [session])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadAppointments(), loadPlans(), loadRecentLogs()])
    setLoading(false)
  }

  async function loadAppointments() {
    const { data } = await supabase
      .from('appointments')
      .select('id, appointment_date, start_time, end_time, status, services(name), practitioners(specialty, profiles(full_name))')
      .eq('patient_id', session.user.id)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })

    setAppointments(data || [])
  }

  async function loadPlans() {
    const { data: plansData } = await supabase
      .from('exercise_plans')
      .select('id, title, created_at')
      .eq('patient_id', session.user.id)
      .eq('active', true)
      .order('created_at', { ascending: false })

    const plansWithItems = await Promise.all(
      (plansData || []).map(async (plan) => {
        const { data: items } = await supabase
          .from('plan_items')
          .select('id, sets, reps, notes, exercises(name, instructions, image_url)')
          .eq('plan_id', plan.id)
          .order('sort_order', { ascending: true })
        return { ...plan, items: items || [] }
      })
    )

    setPlans(plansWithItems)
  }

  async function loadRecentLogs() {
    const { data } = await supabase
      .from('progress_logs')
      .select('id, log_date, pain_level, completed, notes, plan_items(exercises(name))')
      .eq('patient_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentLogs(data || [])
  }

  async function cancelAppointment(id) {
    setCancellingId(id)
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
    await loadAppointments()
    setCancellingId(null)
  }

  function toggleLogForm(itemId) {
    setLogForms((prev) => ({
      ...prev,
      [itemId]: prev[itemId]?.open
        ? { ...prev[itemId], open: false }
        : { painLevel: 3, completed: true, notes: '', open: true },
    }))
  }

  function updateLogForm(itemId, field, value) {
    setLogForms((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }))
  }

  async function submitLog(itemId) {
    const form = logForms[itemId]
    setSavingLogId(itemId)

    await supabase.from('progress_logs').insert({
      patient_id: session.user.id,
      plan_item_id: itemId,
      pain_level: form.painLevel,
      completed: form.completed,
      notes: form.notes,
    })

    setLogForms((prev) => ({ ...prev, [itemId]: { ...prev[itemId], open: false } }))
    setSavingLogId(null)
    loadRecentLogs()
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const upcoming = appointments.filter((a) => a.appointment_date >= todayStr && a.status !== 'cancelled')
  const past = appointments.filter((a) => a.appointment_date < todayStr || a.status === 'cancelled')

  return (
    <div className="container" style={{ paddingTop: 56, paddingBottom: 80 }}>
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
        {!loading && plans.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)' }}>
            No active exercise plan yet — your practitioner will set one up after your visit.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {plans.map((plan) => (
            <div className="plan-card" key={plan.id}>
              <strong>{plan.title}</strong>
              <ul className="plan-item-list" style={{ marginTop: 12 }}>
                {plan.items.map((item) => (
                  <li key={item.id} className="exercise-item">
                    <div>
                      <strong>{item.exercises?.name}</strong>
                      <p className="appt-meta">{item.sets} sets × {item.reps} reps{item.notes ? ` · ${item.notes}` : ''}</p>
                      {item.exercises?.instructions && <p className="exercise-instructions">{item.exercises.instructions}</p>}
                      {item.exercises?.image_url && (
                        <img src={item.exercises.image_url} alt={item.exercises.name} className="exercise-image" />
                      )}
                    </div>
                    <button className="btn btn--secondary" onClick={() => toggleLogForm(item.id)}>
                      {logForms[item.id]?.open ? 'Close' : 'Log Today'}
                    </button>
                    {logForms[item.id]?.open && (
                      <div className="log-form">
                        <label>
                          Pain level (0–10)
                          <input
                            type="number" min="0" max="10"
                            value={logForms[item.id].painLevel}
                            onChange={(e) => updateLogForm(item.id, 'painLevel', Number(e.target.value))}
                          />
                        </label>
                        <label className="log-form__checkbox">
                          <input
                            type="checkbox"
                            checked={logForms[item.id].completed}
                            onChange={(e) => updateLogForm(item.id, 'completed', e.target.checked)}
                          />
                          Completed
                        </label>
                        <label>
                          Notes
                          <input
                            type="text"
                            value={logForms[item.id].notes}
                            onChange={(e) => updateLogForm(item.id, 'notes', e.target.value)}
                          />
                        </label>
                        <button
                          className="btn btn--primary"
                          disabled={savingLogId === item.id}
                          onClick={() => submitLog(item.id)}
                        >
                          {savingLogId === item.id ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {recentLogs.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h3 style={{ marginBottom: 16 }}>Recent Check-ins</h3>
          <div className="appt-list">
            {recentLogs.map((log) => (
              <div className="appt-card appt-card--muted" key={log.id}>
                <div>
                  <strong>{log.plan_items?.exercises?.name || 'Exercise'}</strong>
                  <p className="appt-meta">
                    {log.log_date} · Pain {log.pain_level}/10 · {log.completed ? 'Completed' : 'Not completed'}
                    {log.notes ? ` · ${log.notes}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
