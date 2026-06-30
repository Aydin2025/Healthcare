import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatTimeLabel, formatDateLabel, getMonday } from '../utils/time'
import CalendarWeek from '../components/CalendarWeek'

export default function StaffDashboard() {
  const { profile, session, signOut } = useAuth()
  const [practitionerId, setPractitionerId] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [paymentPromptFor, setPaymentPromptFor] = useState(null)
  const [finalizing, setFinalizing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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
      .select('id, appointment_date, start_time, end_time, status, amount_cents, payment_status, payment_method, receipt_sent_at, services(name), profiles(full_name)')
      .eq('practitioner_id', practitionerRow.id)
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })

    setAppointments(data || [])
    setLoading(false)
  }

  async function sendReceipt(appointmentId) {
    try {
      await fetch('/.netlify/functions/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      })
    } catch (err) {
      console.error('Failed to send receipt:', err)
    }
  }

  async function updateStatus(id, status) {
    setUpdatingId(id)
    await supabase.from('appointments').update({ status }).eq('id', id)
    await init()
    setUpdatingId(null)
    setSuccessMessage(status === 'completed' ? 'Visit marked completed.' : 'Visit cancelled.')
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  // A priced visit that hasn't been paid online needs a quick prompt
  // asking how it was paid in person. Free/unpriced visits, or ones
  // already paid online, complete immediately.
  function handleMarkCompleted(appt) {
    setPaymentError('')
    if (appt.amount_cents && appt.payment_status === 'unpaid') {
      setPaymentPromptFor(appt)
    } else {
      const alreadyPaid = appt.amount_cents && appt.payment_status !== 'unpaid'
      updateStatus(appt.id, 'completed')
      if (alreadyPaid) sendReceipt(appt.id)
    }
  }

  async function finalizeWithPayment(method) {
    setFinalizing(true)
    setPaymentError('')

    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        payment_status: method ? 'paid_in_person' : 'unpaid',
        payment_method: method,
        paid_at: method ? new Date().toISOString() : null,
      })
      .eq('id', paymentPromptFor.id)

    setFinalizing(false)

    if (error) {
      console.error('Failed to finalize payment:', error)
      setPaymentError(error.message)
      return
    }

    const appointmentId = paymentPromptFor.id
    setPaymentPromptFor(null)
    init()
    setSuccessMessage(method ? `Visit marked completed and paid (${method}).` : 'Visit marked completed (still unpaid).')
    setTimeout(() => setSuccessMessage(''), 4000)

    if (method) sendReceipt(appointmentId)
  }

  function prevWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 7)
      return d
    })
  }
  function nextWeek() {
    setWeekStart((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 7)
      return d
    })
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const upcoming = appointments.filter((a) => a.appointment_date >= todayStr && a.status === 'confirmed')
  const past = appointments.filter((a) => a.appointment_date < todayStr || a.status !== 'confirmed')

  return (
    <div className="container" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="eyebrow">Staff Dashboard</p>
          <h1>Welcome, {profile?.full_name || 'there'}.</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/staff/patients" className="btn btn--secondary">Patients</Link>
          <Link to="/staff/exercises" className="btn btn--secondary">Exercise Library</Link>
          <Link to="/settings" className="btn btn--secondary">Profile</Link>
          <button className="btn btn--secondary" onClick={signOut}>Log Out</button>
        </div>
      </div>

      {successMessage && (
        <p className="status-badge status-badge--completed" style={{ marginTop: 20, display: 'inline-block' }}>
          {successMessage}
        </p>
      )}

      {!loading && !practitionerId && (
        <p style={{ marginTop: 24, color: 'var(--color-coral-dark)' }}>
          No practitioner record found for your account. Add a row in Supabase's
          "practitioners" table with profile_id = your user id.
        </p>
      )}

      <section style={{ marginTop: 40 }}>
        <h3 style={{ marginBottom: 16 }}>Calendar</h3>
        {!loading && practitionerId && (
          <CalendarWeek
            appointments={appointments}
            weekStart={weekStart}
            onPrevWeek={prevWeek}
            onNextWeek={nextWeek}
          />
        )}
      </section>

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
                  {a.amount_cents ? ` · $${(a.amount_cents / 100).toFixed(2)}` : ''}
                </p>
                {a.amount_cents ? (
                  <span
                    className={`status-badge ${a.payment_status !== 'unpaid' ? 'status-badge--completed' : ''}`}
                    style={{ marginTop: 6, display: 'inline-block' }}
                  >
                    {a.payment_status === 'unpaid'
                      ? 'unpaid'
                      : a.payment_status === 'paid_online'
                        ? 'paid online'
                        : `paid (${a.payment_method})`}
                  </span>
                ) : null}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn--secondary"
                  disabled={updatingId === a.id}
                  onClick={() => handleMarkCompleted(a)}
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
                    {a.amount_cents ? ` · $${(a.amount_cents / 100).toFixed(2)}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className={`status-badge status-badge--${a.status}`}>{a.status}</span>
                  {a.amount_cents ? (
                    <span className={`status-badge ${a.payment_status !== 'unpaid' ? 'status-badge--completed' : ''}`}>
                      {a.payment_status === 'unpaid'
                        ? 'unpaid'
                        : a.payment_status === 'paid_online'
                          ? 'paid online'
                          : `paid (${a.payment_method})`}
                    </span>
                  ) : null}
                  {a.receipt_sent_at ? <span className="status-badge status-badge--completed">receipt sent</span> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {paymentPromptFor && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Mark visit as paid</h3>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>
              {paymentPromptFor.profiles?.full_name || 'This patient'}'s visit
              {paymentPromptFor.amount_cents ? ` ($${(paymentPromptFor.amount_cents / 100).toFixed(2)})` : ''}{' '}
              hasn't been paid online. How was it paid in person?
            </p>
            {paymentError && <p className="auth-error" style={{ marginTop: 10 }}>{paymentError}</p>}
            {finalizing && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: 6 }}>Saving…</p>}
            <div className="modal-options">
              <button className="btn btn--secondary" disabled={finalizing} onClick={() => finalizeWithPayment('stripe')}>Stripe Terminal</button>
              <button className="btn btn--secondary" disabled={finalizing} onClick={() => finalizeWithPayment('square')}>Square</button>
              <button className="btn btn--secondary" disabled={finalizing} onClick={() => finalizeWithPayment('cash')}>Cash</button>
              <button className="btn btn--secondary" disabled={finalizing} onClick={() => finalizeWithPayment('other')}>Other</button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn--secondary" disabled={finalizing} onClick={() => finalizeWithPayment(null)}>
                Skip — leave unpaid
              </button>
              <button className="btn btn--secondary" disabled={finalizing} onClick={() => setPaymentPromptFor(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
