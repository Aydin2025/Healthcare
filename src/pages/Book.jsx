import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

// --- time helpers -------------------------------------------------
function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function minutesToTime(m) {
  const h = Math.floor(m / 60).toString().padStart(2, '0')
  const min = (m % 60).toString().padStart(2, '0')
  return `${h}:${min}:00`
}
function formatTimeLabel(t) {
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`
}

// Builds a list of bookable slots for one day, given the
// practitioner's working hours and what's already booked.
function generateSlots(availabilityBlocks, existingAppointments, durationMinutes, selectedDate) {
  const slots = []
  const now = new Date()
  const isToday = selectedDate === now.toISOString().split('T')[0]
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  availabilityBlocks.forEach((block) => {
    let start = timeToMinutes(block.start_time)
    const end = timeToMinutes(block.end_time)

    while (start + durationMinutes <= end) {
      const slotStart = start
      const slotEnd = start + durationMinutes

      const overlaps = existingAppointments.some((appt) => {
        const apptStart = timeToMinutes(appt.start_time)
        const apptEnd = timeToMinutes(appt.end_time)
        return slotStart < apptEnd && slotEnd > apptStart
      })

      const isPast = isToday && slotStart <= nowMinutes

      if (!overlaps && !isPast) {
        slots.push({ start: minutesToTime(slotStart), end: minutesToTime(slotEnd) })
      }

      start += durationMinutes
    }
  })

  return slots
}

export default function Book() {
  const { session } = useAuth()

  const [step, setStep] = useState(1)
  const [services, setServices] = useState([])
  const [practitioners, setPractitioners] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [selectedPractitioner, setSelectedPractitioner] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!session) return
    async function loadData() {
      const { data: servicesData } = await supabase.from('services').select('*').eq('active', true)
      setServices(servicesData || [])

      const { data: practitionersData } = await supabase
        .from('practitioners')
        .select('id, specialty, bio, profiles(full_name)')
        .eq('active', true)
      setPractitioners(practitionersData || [])
    }
    loadData()
  }, [session])

  useEffect(() => {
    if (step === 3 && selectedDate && selectedPractitioner && selectedService) {
      loadSlots()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedPractitioner, step])

  async function loadSlots() {
    setLoadingSlots(true)
    setSlots([])
    setSelectedSlot(null)

    const dayOfWeek = new Date(selectedDate + 'T00:00:00').getDay()

    const { data: availabilityData } = await supabase
      .from('availability')
      .select('start_time, end_time')
      .eq('practitioner_id', selectedPractitioner.id)
      .eq('day_of_week', dayOfWeek)

    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('practitioner_id', selectedPractitioner.id)
      .eq('appointment_date', selectedDate)
      .neq('status', 'cancelled')

    const generated = generateSlots(
      availabilityData || [],
      appointmentsData || [],
      selectedService.duration_minutes,
      selectedDate
    )

    setSlots(generated)
    setLoadingSlots(false)
  }

  async function confirmBooking() {
    setBooking(true)
    setError('')

    const { error } = await supabase.from('appointments').insert({
      patient_id: session.user.id,
      practitioner_id: selectedPractitioner.id,
      service_id: selectedService.id,
      appointment_date: selectedDate,
      start_time: selectedSlot.start,
      end_time: selectedSlot.end,
      status: 'confirmed',
    })

    setBooking(false)

    if (error) {
      setError(error.message)
      return
    }

    setConfirmed(true)
  }

  // --- not logged in -------------------------------------------------
  if (!session) {
    return (
      <div className="container" style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center' }}>
        <h1>Log in to book a visit</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 12, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
          Create a free account so we can keep your appointments and exercise plan in one place.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 28 }}>
          <Link to="/login" className="btn btn--secondary">Log In</Link>
          <Link to="/signup" className="btn btn--primary">Sign Up</Link>
        </div>
      </div>
    )
  }

  // --- confirmed -------------------------------------------------
  if (confirmed) {
    return (
      <div className="container" style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center' }}>
        <h1>You're all set.</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 12 }}>
          {selectedService.name} with {selectedPractitioner.profiles?.full_name || 'your practitioner'} on{' '}
          {selectedDate} at {formatTimeLabel(selectedSlot.start)}.
        </p>
        <Link to="/dashboard" className="btn btn--primary" style={{ marginTop: 24 }}>Go to Dashboard</Link>
      </div>
    )
  }

  const todayStr = new Date().toISOString().split('T')[0]

  // --- booking form -------------------------------------------------
  return (
    <div className="container" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <p className="eyebrow">Book a visit</p>
      <h1 style={{ marginBottom: 28 }}>Book a Visit</h1>

      <div className="booking-progress">
        {['Service', 'Practitioner', 'Time', 'Confirm'].map((label, idx) => {
          const stepNum = idx + 1
          const state = stepNum < step ? 'done' : stepNum === step ? 'active' : 'upcoming'
          return (
            <div className={`booking-progress__item booking-progress__item--${state}`} key={label}>
              <div className="booking-progress__circle">{state === 'done' ? '✓' : stepNum}</div>
              <span className="booking-progress__label">{label}</span>
            </div>
          )
        })}
      </div>

      {error && <p className="auth-error" style={{ marginBottom: 20 }}>{error}</p>}

      {step === 1 && (
        <div className="booking-options">
          {services.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)' }}>
              No services found — add some in the Supabase "services" table first.
            </p>
          )}
          {services.map((service) => (
            <button
              key={service.id}
              className="booking-option"
              onClick={() => { setSelectedService(service); setStep(2) }}
            >
              <strong>{service.name}</strong>
              <span>{service.duration_minutes} min</span>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="booking-options">
            {practitioners.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)' }}>No practitioners found yet.</p>
            )}
            {practitioners.map((p) => (
              <button
                key={p.id}
                className="booking-option"
                onClick={() => { setSelectedPractitioner(p); setStep(3) }}
              >
                <strong>{p.profiles?.full_name || 'Practitioner'}</strong>
                <span>{p.specialty}</span>
              </button>
            ))}
          </div>
          <button className="btn btn--secondary" onClick={() => setStep(1)} style={{ marginTop: 16 }}>Back</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <label style={{ display: 'block', marginBottom: 20, maxWidth: 240 }}>
            Date
            <input
              type="date"
              min={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ display: 'block', marginTop: 6, padding: '10px 12px', borderRadius: 6, border: '1px solid var(--color-border)', width: '100%' }}
            />
          </label>

          {loadingSlots && <p>Loading available times…</p>}

          {!loadingSlots && selectedDate && slots.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)' }}>No available times that day. Try another date.</p>
          )}

          <div className="slot-grid">
            {slots.map((slot) => (
              <button
                key={slot.start}
                className={selectedSlot?.start === slot.start ? 'slot-btn slot-btn--active' : 'slot-btn'}
                onClick={() => setSelectedSlot(slot)}
              >
                {formatTimeLabel(slot.start)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button className="btn btn--secondary" onClick={() => setStep(2)}>Back</button>
            <button className="btn btn--primary" disabled={!selectedSlot} onClick={() => setStep(4)}>Continue</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="auth-card" style={{ maxWidth: 480 }}>
          <h3>Confirm your booking</h3>
          <p><strong>Service:</strong> {selectedService.name} ({selectedService.duration_minutes} min)</p>
          <p><strong>Practitioner:</strong> {selectedPractitioner.profiles?.full_name || '—'}</p>
          <p><strong>Date:</strong> {selectedDate}</p>
          <p><strong>Time:</strong> {formatTimeLabel(selectedSlot.start)} – {formatTimeLabel(selectedSlot.end)}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button className="btn btn--secondary" onClick={() => setStep(3)}>Back</button>
            <button className="btn btn--primary" disabled={booking} onClick={confirmBooking}>
              {booking ? 'Booking…' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
