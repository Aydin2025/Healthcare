import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function PatientPlanEditor() {
  const { patientId } = useParams()
  const { session } = useAuth()

  const [patientName, setPatientName] = useState('')
  const [plans, setPlans] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)

  const [newPlanTitle, setNewPlanTitle] = useState('')
  const [creatingPlan, setCreatingPlan] = useState(false)

  const [itemForms, setItemForms] = useState({}) // planId -> { exerciseId, sets, reps, notes }
  const [addingItemPlanId, setAddingItemPlanId] = useState(null)

  useEffect(() => {
    loadAll()
  }, [patientId])

  async function loadAll() {
    setLoading(true)

    const { data: patientProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', patientId)
      .single()
    setPatientName(patientProfile?.full_name || 'Patient')

    const { data: exercisesData } = await supabase.from('exercises').select('*').order('name')
    setExercises(exercisesData || [])

    await loadPlans()

    setLoading(false)
  }

  async function loadPlans() {
    const { data: plansData } = await supabase
      .from('exercise_plans')
      .select('id, title, active, created_at')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    const plansWithItems = await Promise.all(
      (plansData || []).map(async (plan) => {
        const { data: items } = await supabase
          .from('plan_items')
          .select('id, sets, reps, notes, sort_order, exercises(id, name)')
          .eq('plan_id', plan.id)
          .order('sort_order', { ascending: true })
        return { ...plan, items: items || [] }
      })
    )

    setPlans(plansWithItems)
  }

  async function createPlan(e) {
    e.preventDefault()
    setCreatingPlan(true)

    await supabase.from('exercise_plans').insert({
      patient_id: patientId,
      practitioner_id: session.user.id,
      title: newPlanTitle,
    })

    setNewPlanTitle('')
    setCreatingPlan(false)
    loadPlans()
  }

  async function togglePlanActive(plan) {
    await supabase.from('exercise_plans').update({ active: !plan.active }).eq('id', plan.id)
    loadPlans()
  }

  function openItemForm(planId) {
    setAddingItemPlanId(planId)
    setItemForms((prev) => ({ ...prev, [planId]: { exerciseId: '', sets: 3, reps: 10, notes: '' } }))
  }

  function updateItemForm(planId, field, value) {
    setItemForms((prev) => ({ ...prev, [planId]: { ...prev[planId], [field]: value } }))
  }

  async function addItem(plan) {
    const form = itemForms[plan.id]
    if (!form?.exerciseId) return

    await supabase.from('plan_items').insert({
      plan_id: plan.id,
      exercise_id: form.exerciseId,
      sets: form.sets,
      reps: form.reps,
      notes: form.notes,
      sort_order: plan.items.length,
    })

    setAddingItemPlanId(null)
    loadPlans()
  }

  if (loading) {
    return <div className="container" style={{ padding: '80px 0' }}>Loading…</div>
  }

  return (
    <div className="container" style={{ padding: '56px 0 80px' }}>
      <p className="eyebrow"><Link to="/staff/patients" style={{ color: 'var(--color-primary)' }}>← Back to Patients</Link></p>
      <h1 style={{ marginBottom: 28 }}>{patientName}'s Plans</h1>

      <form className="auth-card" style={{ maxWidth: 420, marginBottom: 40 }} onSubmit={createPlan}>
        <h3>New plan</h3>
        <label>
          Title
          <input type="text" value={newPlanTitle} onChange={(e) => setNewPlanTitle(e.target.value)} placeholder="e.g. Week 1 — Shoulder mobility" required />
        </label>
        <button className="btn btn--primary" type="submit" disabled={creatingPlan}>
          {creatingPlan ? 'Creating…' : 'Create Plan'}
        </button>
      </form>

      {plans.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No plans yet for this patient.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {plans.map((plan) => (
          <div className="plan-card" key={plan.id}>
            <div className="plan-card__header">
              <div>
                <strong>{plan.title}</strong>
                <span className={`status-badge ${plan.active ? 'status-badge--completed' : ''}`} style={{ marginLeft: 10 }}>
                  {plan.active ? 'active' : 'inactive'}
                </span>
              </div>
              <button className="btn btn--secondary" onClick={() => togglePlanActive(plan)}>
                {plan.active ? 'Set Inactive' : 'Set Active'}
              </button>
            </div>

            <ul className="plan-item-list">
              {plan.items.map((item) => (
                <li key={item.id}>
                  <strong>{item.exercises?.name}</strong> — {item.sets} sets × {item.reps} reps
                  {item.notes && <span className="appt-meta"> · {item.notes}</span>}
                </li>
              ))}
              {plan.items.length === 0 && <li className="appt-meta">No exercises added yet.</li>}
            </ul>

            {addingItemPlanId === plan.id ? (
              <div className="add-item-form">
                <select
                  value={itemForms[plan.id]?.exerciseId || ''}
                  onChange={(e) => updateItemForm(plan.id, 'exerciseId', e.target.value)}
                >
                  <option value="">Choose an exercise…</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={itemForms[plan.id]?.sets || 3}
                  onChange={(e) => updateItemForm(plan.id, 'sets', Number(e.target.value))}
                  placeholder="Sets"
                />
                <input
                  type="number"
                  min="1"
                  value={itemForms[plan.id]?.reps || 10}
                  onChange={(e) => updateItemForm(plan.id, 'reps', Number(e.target.value))}
                  placeholder="Reps"
                />
                <input
                  type="text"
                  value={itemForms[plan.id]?.notes || ''}
                  onChange={(e) => updateItemForm(plan.id, 'notes', e.target.value)}
                  placeholder="Notes (optional)"
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn--primary" onClick={() => addItem(plan)}>Add</button>
                  <button className="btn btn--secondary" onClick={() => setAddingItemPlanId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn btn--secondary" style={{ marginTop: 12 }} onClick={() => openItemForm(plan.id)}>
                + Add Exercise
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
