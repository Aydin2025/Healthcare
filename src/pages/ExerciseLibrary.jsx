import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function ExerciseLibrary() {
  const { session } = useAuth()
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadExercises()
  }, [])

  async function loadExercises() {
    setLoading(true)
    const { data } = await supabase.from('exercises').select('*').order('name', { ascending: true })
    setExercises(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { error } = await supabase.from('exercises').insert({
      name,
      instructions,
      image_url: imageUrl || null,
      created_by: session.user.id,
    })

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    setName('')
    setInstructions('')
    setImageUrl('')
    loadExercises()
  }

  return (
    <div className="container" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <p className="eyebrow">Exercise Library</p>
      <h1 style={{ marginBottom: 8 }}>Exercise Library</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>
        Build a reusable set of exercises here, then assign them to patients from{' '}
        <Link to="/staff/patients" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Patients</Link>.
      </p>

      <form className="auth-card" style={{ maxWidth: 520, marginBottom: 40 }} onSubmit={handleSubmit}>
        <h3>Add an exercise</h3>
        {error && <p className="auth-error">{error}</p>}
        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Instructions
          <input type="text" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Stand tall, slowly raise..." />
        </label>
        <label>
          Image URL <span style={{ fontWeight: 400 }}>(optional)</span>
          <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </label>
        <button className="btn btn--primary" type="submit" disabled={saving}>
          {saving ? 'Adding…' : 'Add Exercise'}
        </button>
      </form>

      <h3 style={{ marginBottom: 16 }}>All Exercises</h3>
      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>}
      <div className="exercise-library-grid">
        {exercises.map((ex) => (
          <div className="exercise-library-card" key={ex.id}>
            {ex.image_url && <img src={ex.image_url} alt={ex.name} />}
            <strong>{ex.name}</strong>
            {ex.instructions && <p>{ex.instructions}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
