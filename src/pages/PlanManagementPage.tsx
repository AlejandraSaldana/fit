import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { Trash2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import type { Plan } from '../lib/supabase'
import { ImportPlanPage } from './ImportPlanPage'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatPlanDateRange(start: string | null, end: string | null): string {
  if (!start || !end) return '—'
  const year = end.split('-')[0]
  return `${formatDateShort(start)} – ${formatDateShort(end)}, ${year}`
}

// ── Component ──────────────────────────────────────────────────────────────

interface PlanManagementPageProps {
  user: User
  onPlanChange: () => void
}

export function PlanManagementPage({ user, onPlanChange }: PlanManagementPageProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showImporter, setShowImporter] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadPlans() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setPlans(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPlans()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(planId: string) {
    setDeletingId(planId)
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as unknown as { from: (t: string) => any }

    // Soft delete the plan to preserve FK references from workout_sessions
    const { error: planErr } = await db
      .from('plans')
      .update({ status: 'deleted' })
      .eq('id', planId)
      .eq('user_id', user.id)

    if (planErr) {
      setError((planErr as { message: string }).message)
      setDeletingId(null)
      return
    }

    // Cancel planned workouts so they no longer appear on the Today view
    await db
      .from('workouts')
      .update({ status: 'cancelled' })
      .eq('plan_id', planId)
      .eq('status', 'planned')

    await loadPlans()
    onPlanChange()
    setDeletingId(null)
  }

  async function handleSetActive(planId: string) {
    setError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as unknown as { from: (t: string) => any }

    const { error: err1 } = await db
      .from('plans')
      .update({ status: 'inactive' })
      .eq('user_id', user.id)
      .neq('status', 'deleted')

    if (err1) {
      setError((err1 as { message: string }).message)
      return
    }

    const { error: err2 } = await db
      .from('plans')
      .update({ status: 'active' })
      .eq('id', planId)

    if (err2) {
      setError((err2 as { message: string }).message)
      return
    }

    await loadPlans()
    onPlanChange()
  }

  // ── Show importer ─────────────────────────────────────────────────────────
  if (showImporter) {
    return (
      <ImportPlanPage
        user={user}
        onImportComplete={() => {
          setShowImporter(false)
          loadPlans()
          onPlanChange()
        }}
      />
    )
  }

  // ── Plan list ─────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-title font-semibold text-ink">My Plans</h1>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowImporter(true)}
        >
          + Import Plan
        </Button>
      </div>

      {error && (
        <p className="text-xs text-danger mt-2">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
          <p className="text-sm text-muted text-center">No plans yet.</p>
          <Button variant="ghost" size="md" onClick={() => setShowImporter(true)}>
            Import your first plan
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          {plans.map((plan) => (
            <Card key={plan.id} variant="default" className="mb-3 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <p className="text-sm font-semibold text-ink">{plan.name}</p>
                    {plan.status === 'active' && (
                      <span className="text-xs bg-accent-light text-accent rounded-full px-2 py-0.5">
                        Active
                      </span>
                    )}
                  </div>
                  {plan.goal && (
                    <p className="text-xs text-muted mt-1">{plan.goal}</p>
                  )}
                  <p className="text-xs text-muted mt-0.5">
                    {formatPlanDateRange(plan.start_date, plan.end_date)}
                  </p>
                </div>

                <div className="flex-shrink-0 pt-0.5">
                  {deletingId === plan.id ? (
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  ) : confirmDeleteId !== plan.id ? (
                    <Trash2
                      size={16}
                      className="text-muted cursor-pointer"
                      onClick={() => setConfirmDeleteId(plan.id)}
                    />
                  ) : null}
                </div>
              </div>

              {/* Inline delete confirmation */}
              {confirmDeleteId === plan.id && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted mb-2">
                    Delete this plan? Workouts linked to it will be removed from your schedule.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-danger"
                      onClick={() => {
                        setConfirmDeleteId(null)
                        void handleDelete(plan.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              {plan.status !== 'active' && confirmDeleteId !== plan.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => handleSetActive(plan.id)}
                >
                  Set as active
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
