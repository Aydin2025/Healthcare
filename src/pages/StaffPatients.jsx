import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function StaffPatients() {
  const { session } = useAuth()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPatients()
  }, [])

  async function loadPatients() {
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

    const { data } = await supabase
      .from('appointments')
      .select('patient_id, profiles(full_name)')
      .eq('practitioner_id', practitionerRow.id)

    const uniquePatients = []
    const seen = new Set()
    for (const row of data || []) {
      if (!seen.has(row.patient_id)) {
        seen.add(row.patient_id)
        uniquePatients.push({ id: row.patient_id, name: row.profiles?.full_name || 'Patient' })
      }
    }

    setPatients(uniquePatients)
    setLoading(false)
  }

  return (
    <div className="container" style={{ padding: '56px 0 80px' }}>
      <p className="eyebrow">Your Patients</p>
      <h1 style={{ marginBottom: 28 }}>Patients</h1>

      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>}
      {!loading && patients.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>
          No patients yet — they'll show up here once they've booked a visit with you.
        </p>
      )}

      <div className="booking-options">
        {patients.map((p) => (
          <Link to={`/staff/patients/${p.id}`} className="booking-option" key={p.id}>
            <strong>{p.name}</strong>
            <span>View exercise plan</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
