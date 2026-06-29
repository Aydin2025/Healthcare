import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function BookingSuccess() {
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointment_id')
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (appointmentId) load()
  }, [appointmentId])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('appointments')
      .select('id, appointment_date, start_time, payment_status, services(name), practitioners(profiles(full_name))')
      .eq('id', appointmentId)
      .single()
    setAppointment(data)
    setLoading(false)
  }

  if (!appointmentId) {
    return (
      <div className="container" style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center' }}>
        <h1>Something's missing</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 12 }}>No appointment reference found.</p>
        <Link to="/dashboard" className="btn btn--primary" style={{ marginTop: 24 }}>Go to Dashboard</Link>
      </div>
    )
  }

  const isPaid = appointment?.payment_status === 'paid_online'

  return (
    <div className="container" style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center' }}>
      <p className="eyebrow">Payment</p>
      <h1>{loading ? 'One moment…' : isPaid ? "You're all set." : 'Almost there…'}</h1>

      {!loading && appointment && (
        <>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 16 }}>
            {appointment.services?.name} with {appointment.practitioners?.profiles?.full_name || 'your practitioner'}
          </p>
          <p style={{ marginTop: 12 }}>
            <span className={`status-badge ${isPaid ? 'status-badge--completed' : ''}`}>
              {isPaid ? 'Payment confirmed' : 'Confirming with Stripe…'}
            </span>
          </p>
          {!isPaid && (
            <p style={{ color: 'var(--color-text-muted)', marginTop: 12, fontSize: '0.85rem' }}>
              This usually takes just a few seconds.{' '}
              <button className="btn btn--secondary" onClick={load} style={{ marginLeft: 8 }}>Refresh</button>
            </p>
          )}
        </>
      )}

      <div>
        <Link to="/dashboard" className="btn btn--primary" style={{ marginTop: 28 }}>Go to Dashboard</Link>
      </div>
    </div>
  )
}
