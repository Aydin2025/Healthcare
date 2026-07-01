import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

const ROLES = ['patient', 'practitioner', 'admin']

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [changingId, setChangingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, created_at')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  async function changeRole(userId, newRole) {
    setChangingId(userId)
    setError('')
    setSuccess('')

    const { error } = await supabase.rpc('set_user_role', {
      target_user_id: userId,
      new_role: newRole,
    })

    setChangingId(null)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(`Role updated to ${newRole}.`)
    setTimeout(() => setSuccess(''), 4000)
    loadUsers()
  }

  async function deleteUser(userId, name) {
    if (!window.confirm(`Permanently delete ${name || 'this user'}? This cannot be undone.`)) return
    setDeletingId(userId)
    setError('')

    const { error } = await supabase.rpc('delete_user', { target_user_id: userId })

    setDeletingId(null)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess('User deleted.')
    setTimeout(() => setSuccess(''), 4000)
    loadUsers()
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Users</h2>
      {error && <p className="auth-error" style={{ marginBottom: 16 }}>{error}</p>}
      {success && <p className="status-badge status-badge--completed" style={{ display: 'inline-block', marginBottom: 16 }}>{success}</p>}
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.full_name || '—'}</strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{u.id.slice(0, 8)}…</p>
                </td>
                <td>{u.phone || '—'}</td>
                <td>
                  <select
                    value={u.role}
                    disabled={changingId === u.id}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="admin-select"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td>
                  <button
                    className="btn btn--secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 12px', color: 'var(--color-coral-dark)', borderColor: 'var(--color-coral)' }}
                    disabled={deletingId === u.id}
                    onClick={() => deleteUser(u.id, u.full_name)}
                  >
                    {deletingId === u.id ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
