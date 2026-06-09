import { useState, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { CheckCircle2, Upload } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { parsePlan } from '../lib/parsePlan'
import type { ParsedPlan } from '../lib/parsePlan'
import { useImportPlan } from '../hooks/useImportPlan'

// ── Formatting helpers ─────────────────────────────────────────────────────

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatDateRange(start: string, end: string): string {
  if (!start || !end) return ''
  const year = end.split('-')[0]
  return `${formatDateShort(start)} – ${formatDateShort(end)}, ${year}`
}

function formatGoalTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Component ──────────────────────────────────────────────────────────────

interface ImportPlanPageProps {
  user: User
  onImportComplete: () => void
}

type View = 'paste' | 'preview' | 'importing'

const WORKOUT_TYPES = ['run', 'gym', 'gym_run', 'rest', 'time_trial'] as const

export function ImportPlanPage({ user, onImportComplete }: ImportPlanPageProps) {
  const [view, setView] = useState<View>('paste')
  const [markdownText, setMarkdownText] = useState('')
  const [parsedPlan, setParsedPlan] = useState<ParsedPlan | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { progress, conflictDates, importPlan, reset, resolveConflict } = useImportPlan(user)

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setMarkdownText(text)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleParse() {
    try {
      const plan = parsePlan(markdownText)
      setParsedPlan(plan)
      setParseError(null)
      setView('preview')
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Failed to parse plan.')
    }
  }

  function handleImport() {
    if (!parsedPlan) return
    setView('importing')
    void importPlan(parsedPlan)
  }

  // ── VIEW: paste ───────────────────────────────────────────────────────────
  if (view === 'paste') {
    const lineCount = markdownText ? markdownText.split('\n').length : 0

    return (
      <div>
        <h1 className="text-title font-semibold text-ink">Import Plan</h1>
        <p className="text-sm text-muted mt-1">
          Paste your training plan markdown below
        </p>

        {/* File upload area */}
        <div
          className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer mt-4"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={24} className="text-muted" />
          <p className="text-xs text-muted">
            Drop a .md file or{' '}
            <span
              className="text-accent cursor-pointer"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
            >
              browse
            </span>
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".md,text/markdown,text/plain"
          className="hidden"
          onChange={handleFileUpload}
        />

        {lineCount > 0 && (
          <p className="text-xs text-success mt-2">
            ✓ {lineCount} lines loaded
          </p>
        )}

        <textarea
          value={markdownText}
          onChange={(e) => setMarkdownText(e.target.value)}
          placeholder={"# Preseason Training Plan\n**2026-06-10 – 2026-08-03 | Goal: Run 1km in 3:30**\n\n## Phase 1 — Base Rebuild\n### 2026-06-10 – 2026-06-28\n\n#### 2026-06-10 — Strength + Easy Run\n- type: gym_run\n..."}
          className="w-full border border-border rounded-2xl bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent resize-none font-mono"
          style={{ height: '40vh', marginTop: '16px' }}
        />

        {parseError && (
          <p className="text-xs text-danger mt-2">{parseError}</p>
        )}

        <Button
          variant="primary"
          size="lg"
          className="w-full mt-4"
          onClick={handleParse}
          disabled={!markdownText.trim()}
        >
          Preview Plan
        </Button>
      </div>
    )
  }

  // ── VIEW: preview ─────────────────────────────────────────────────────────
  if (view === 'preview' && parsedPlan) {
    const totalWorkouts = parsedPlan.phases.reduce((s, p) => s + p.workouts.length, 0)

    return (
      <div>
        <div className="flex justify-between items-center">
          <h1 className="text-title font-semibold text-ink">Review Plan</h1>
          <Button variant="ghost" size="sm" onClick={() => setView('paste')}>
            ← Back
          </Button>
        </div>

        {/* Plan summary */}
        <Card variant="default" className="mt-4">
          <p className="text-sm font-semibold text-ink">{parsedPlan.name}</p>
          {parsedPlan.goal && (
            <p className="text-xs text-muted mt-1">{parsedPlan.goal}</p>
          )}
          <p className="text-xs text-muted mt-1">
            {formatDateRange(parsedPlan.start_date, parsedPlan.end_date)}
          </p>
          {parsedPlan.goal_time_seconds > 0 && (
            <p className="text-xs text-accent mt-1">
              Target: {formatGoalTime(parsedPlan.goal_time_seconds)}
            </p>
          )}
        </Card>

        {/* Phases list */}
        <div className="mt-4">
          {parsedPlan.phases.map((phase) => {
            const typeCounts: Record<string, number> = {}
            phase.workouts.forEach((w) => {
              typeCounts[w.type] = (typeCounts[w.type] ?? 0) + 1
            })

            return (
              <Card key={phase.order_index} variant="default" className="mb-2 p-4">
                <p className="text-sm font-semibold text-ink">{phase.name}</p>
                <p className="text-xs text-muted mt-0.5">
                  {phase.workouts.length} workout{phase.workouts.length !== 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {WORKOUT_TYPES.map((type) => {
                    const count = typeCounts[type] ?? 0
                    if (count === 0) return null
                    return (
                      <span
                        key={type}
                        className="text-xs px-2 py-0.5 rounded-full bg-border text-muted"
                      >
                        {count} {type.replace('_', ' ')}
                      </span>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Total summary */}
        <p className="text-xs text-muted mt-2">
          {totalWorkouts} workout{totalWorkouts !== 1 ? 's' : ''} · {parsedPlan.phases.length} phase{parsedPlan.phases.length !== 1 ? 's' : ''} · {formatDateShort(parsedPlan.start_date)} to {formatDateShort(parsedPlan.end_date)}
        </p>

        <Button
          variant="primary"
          size="lg"
          className="w-full mt-6"
          onClick={handleImport}
        >
          Import Plan
        </Button>
      </div>
    )
  }

  // ── VIEW: importing ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">

      {/* Conflict resolution */}
      {progress.phase === 'conflict' && (
        <div className="w-full">
          <div className="flex flex-col items-center mb-5">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
              <span className="text-amber-500 text-xl">⚠</span>
            </div>
            <p className="text-sm font-semibold text-ink text-center">Date conflicts found</p>
            <p className="text-xs text-muted text-center mt-1">
              {conflictDates.length} existing workout{conflictDates.length !== 1 ? 's' : ''} overlap with this plan
            </p>
          </div>

          <div className="space-y-1.5 mb-6 max-h-40 overflow-y-auto scrollbar-hide">
            {conflictDates.slice(0, 6).map((d) => (
              <div key={d} className="flex items-center gap-2 text-xs text-muted px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                {formatDateShort(d)}
              </div>
            ))}
            {conflictDates.length > 6 && (
              <p className="text-xs text-muted px-1">+{conflictDates.length - 6} more</p>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => resolveConflict('overwrite')}
          >
            Replace existing workouts
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full mt-2"
            onClick={() => resolveConflict('keep_existing')}
          >
            Keep existing, skip conflicts
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2"
            onClick={() => {
              reset()
              setView('preview')
            }}
          >
            Cancel import
          </Button>
        </div>
      )}

      {/* Spinner while inserting */}
      {progress.phase !== 'done' && progress.phase !== 'error' && progress.phase !== 'conflict' && (
        <>
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted text-center mt-4">{progress.message}</p>
          {progress.totalWorkouts > 0 && (
            <p className="text-xs text-muted text-center mt-1">
              {progress.workoutsInserted} / {progress.totalWorkouts} workouts
            </p>
          )}
        </>
      )}

      {progress.phase === 'done' && (
        <>
          <CheckCircle2 size={48} className="text-success" />
          <p className="text-title font-semibold text-ink text-center mt-4">
            Plan imported!
          </p>
          {parsedPlan && (
            <p className="text-sm text-muted text-center mt-1">
              {parsedPlan.phases.length} phase{parsedPlan.phases.length !== 1 ? 's' : ''} · {progress.totalWorkouts} workout{progress.totalWorkouts !== 1 ? 's' : ''}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            className="w-full mt-8"
            onClick={onImportComplete}
          >
            Go to Today
          </Button>
        </>
      )}

      {progress.phase === 'error' && (
        <>
          <p className="text-sm text-danger text-center">{progress.error}</p>
          <Button
            variant="ghost"
            size="md"
            className="mt-4"
            onClick={() => {
              reset()
              setView('paste')
            }}
          >
            Try again
          </Button>
        </>
      )}

    </div>
  )
}
