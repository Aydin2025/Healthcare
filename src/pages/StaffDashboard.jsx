import { useAuth } from '../context/AuthContext'

export default function StaffDashboard() {
  const { profile, signOut } = useAuth()

  return (
    <div className="container" style={{ padding: '60px 0' }}>
      <p className="eyebrow">Staff Dashboard</p>
      <h1>Welcome, {profile?.full_name || 'there'}.</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 12, maxWidth: 480 }}>
        Your appointment calendar, patient list, and exercise plan builder
        will appear here once we build those in the next steps.
      </p>
      <button className="btn btn--secondary" style={{ marginTop: 24 }} onClick={signOut}>
        Log Out
      </button>
    </div>
  )
}
