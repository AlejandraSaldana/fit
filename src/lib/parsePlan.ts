// ── Exported types ─────────────────────────────────────────────────────────

export interface ParsedExercise {
  name: string
  order_index: number
  sets: number
  reps: number
  target_weight_kg: number | null
}

export interface ParsedWorkout {
  scheduled_date: string
  type: string
  name: string
  duration_mins: number | null
  coach_note: string | null
  exercises: ParsedExercise[]
}

export interface ParsedPhase {
  name: string
  order_index: number
  start_date: string
  end_date: string
  workouts: ParsedWorkout[]
}

export interface ParsedPlan {
  name: string
  goal: string
  goal_time_seconds: number
  start_date: string
  end_date: string
  phases: ParsedPhase[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function parseTimeToSeconds(time: string): number {
  const parts = time.split(':')
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
  }
  return 0
}

function parseSetsReps(str: string): { sets: number; reps: number } {
  // Handles "4 × 6", "4x6", "4 x 6", "4×6" (U+00D7)
  const match = str.match(/(\d+)\s*[×xX]\s*(\d+)/)
  if (match) {
    return { sets: parseInt(match[1], 10), reps: parseInt(match[2], 10) }
  }
  return { sets: 0, reps: 0 }
}

function parseWeightKg(str: string): number | null {
  const lower = str.toLowerCase().trim()
  if (lower.includes('bodyweight') || lower === 'bw' || lower === 'body' || lower === '-') {
    return null
  }
  const match = str.match(/(\d+(?:\.\d+)?)/)
  if (match) {
    return parseFloat(match[1]) / 2.20462
  }
  return null
}

// ── Main parser ────────────────────────────────────────────────────────────

export function parsePlan(markdown: string): ParsedPlan {
  const lines = markdown.split('\n')

  let planName = 'Training Plan'
  let planGoal = ''
  let planGoalTimeSeconds = 210
  let planStartDate = ''
  let planEndDate = ''

  const phases: ParsedPhase[] = []
  let phaseIdx = 0

  // Mutable working objects — replaced on each new phase/workout
  interface MutableWorkout {
    scheduled_date: string
    type: string
    name: string
    duration_mins: number | null
    coach_note: string | null
    exercises: ParsedExercise[]
  }
  interface MutablePhase {
    name: string
    order_index: number
    start_date: string
    end_date: string
    workouts: ParsedWorkout[]
  }

  let curPhase: MutablePhase | null = null
  let curWorkout: MutableWorkout | null = null
  let noteLines: string[] = []
  let inStrengthTable = false
  let exIdx = 0

  function finalizeWorkout() {
    const wk = curWorkout
    if (!wk) return

    const rawNote = noteLines
      .map((l) =>
        l
          .replace(/^[-*]\s*/, '')        // strip bullet prefix
          .replace(/\*\*([^*]+)\*\*/g, '$1') // strip bold markers
          .trim(),
      )
      .filter(Boolean)
      .join(' ')
      .slice(0, 500)

    wk.coach_note = rawNote || null

    if (wk.duration_mins == null) {
      const durationMatch = rawNote.match(/(\d+)\s*(?:min|minutes)/)
      if (durationMatch) {
        wk.duration_mins = parseInt(durationMatch[1], 10)
      } else if (wk.type === 'gym' || wk.type === 'gym_run') {
        wk.duration_mins = 60
      }
    }

    if (curPhase) {
      curPhase.workouts.push({
        scheduled_date: wk.scheduled_date,
        type: wk.type,
        name: wk.name,
        duration_mins: wk.duration_mins,
        coach_note: wk.coach_note,
        exercises: [...wk.exercises],
      })
    }

    curWorkout = null
    noteLines = []
    inStrengthTable = false
    exIdx = 0
  }

  function finalizePhase() {
    finalizeWorkout()
    const ph = curPhase
    if (!ph) return
    phases.push({
      name: ph.name,
      order_index: ph.order_index,
      start_date: ph.start_date,
      end_date: ph.end_date,
      workouts: [...ph.workouts],
    })
    curPhase = null
  }

  for (const line of lines) {
    const t = line.trim()
    if (!t) continue

    // Plan title: # Title  (single #, not ##)
    if (t.startsWith('# ') && !t.startsWith('## ')) {
      planName = t.slice(2).trim()
      continue
    }

    // Plan header with dates and goal
    // **2026-06-10 – 2026-08-03 | Goal: Run 1km in 3:30**
    if (t.includes('Goal:') && /\d{4}-\d{2}-\d{2}/.test(t)) {
      const dateMatch = t.match(/(\d{4}-\d{2}-\d{2})\s*[–—-]\s*(\d{4}-\d{2}-\d{2})/)
      if (dateMatch && !planStartDate) {
        planStartDate = dateMatch[1]
        planEndDate = dateMatch[2]
      }
      const goalMatch = t.match(/Goal:\s*(.+?)(?:\*+\s*$|\s*$)/)
      if (goalMatch) {
        planGoal = goalMatch[1].replace(/\*+$/, '').trim()
        const timeMatch = planGoal.match(/(\d+:\d{2})/)
        if (timeMatch) planGoalTimeSeconds = parseTimeToSeconds(timeMatch[1])
      }
      continue
    }

    // Phase header: ## Phase N — Name  OR  ## Name (e.g., Travel Buffer)
    if (t.startsWith('## ')) {
      finalizePhase()
      const phaseMatch = t.match(/^## Phase \d+\s*[—–-]+\s*(.+)/)
      const phaseName = phaseMatch ? phaseMatch[1].trim() : t.slice(3).trim()
      curPhase = {
        name: phaseName,
        order_index: phaseIdx++,
        start_date: '',
        end_date: '',
        workouts: [],
      }
      continue
    }

    // Phase date range: ### YYYY-MM-DD – YYYY-MM-DD
    if (t.startsWith('### ') && curPhase) {
      const phaseDateMatch = t.match(/^### (\d{4}-\d{2}-\d{2})\s*[–—-]\s*(\d{4}-\d{2}-\d{2})/)
      if (phaseDateMatch) {
        curPhase.start_date = phaseDateMatch[1]
        curPhase.end_date = phaseDateMatch[2]
        continue
      }
    }

    // Day header: #### YYYY-MM-DD — Workout Name
    if (t.startsWith('#### ')) {
      const dayMatch = t.match(/^#### (\d{4}-\d{2}-\d{2})\s*[—–-]+\s*(.+)/)
      if (dayMatch) {
        finalizeWorkout()
        curWorkout = {
          scheduled_date: dayMatch[1],
          type: 'gym',
          name: dayMatch[2].trim(),
          duration_mins: null,
          coach_note: null,
          exercises: [],
        }
        continue
      }
    }

    if (!curWorkout) continue

    // Type line: - type: gym_run
    const typeMatch = t.match(/^-\s*type:\s*(run|gym|gym_run|rest|time_trial)/)
    if (typeMatch) {
      curWorkout.type = typeMatch[1]
      continue
    }

    // Section markers
    if (/^\*\*Strength/i.test(t) || /^Strength:/i.test(t)) {
      inStrengthTable = true
      continue
    }
    if (/^\*\*Run/i.test(t) || /^Run:/i.test(t)) {
      inStrengthTable = false
      continue
    }

    // Table rows
    if (t.startsWith('|') && t.endsWith('|')) {
      const cells = t
        .split('|')
        .map((c) => c.trim())
        .filter((_, i, a) => i > 0 && i < a.length - 1)

      if (cells.length >= 2) {
        // Separator row: all cells are dashes/colons
        if (cells.every((c) => /^[-:]+$/.test(c))) continue

        // Header row: first cell is "Exercise", second mentions "Sets" or "Reps"
        if (
          cells.length >= 3 &&
          /exercise/i.test(cells[0]) &&
          /sets|reps/i.test(cells[1])
        ) {
          inStrengthTable = true
          continue
        }

        // Data row
        if (inStrengthTable && cells.length >= 3) {
          const { sets, reps } = parseSetsReps(cells[1])
          if (sets > 0) {
            curWorkout.exercises.push({
              name: cells[0],
              order_index: exIdx++,
              sets,
              reps,
              target_weight_kg: parseWeightKg(cells[2]),
            })
          }
        }
      }
      continue
    }

    // All other non-empty, non-header lines go into the coach note
    if (!t.startsWith('#')) {
      noteLines.push(t)
    }
  }

  // Finalize anything still open
  finalizePhase()

  // Derive plan dates from phases if not found in header
  if (!planStartDate && phases.length > 0) {
    planStartDate = phases[0].start_date
    planEndDate = phases[phases.length - 1].end_date
  }

  if (!planStartDate || !planEndDate) {
    throw new Error(
      'Could not parse plan dates. Make sure the plan header includes the date range in the format: YYYY-MM-DD – YYYY-MM-DD | Goal: ...',
    )
  }
  if (phases.length === 0) {
    throw new Error('No phases found. Make sure the plan uses ## Phase N — Name headers.')
  }

  return {
    name: planName,
    goal: planGoal,
    goal_time_seconds: planGoalTimeSeconds,
    start_date: planStartDate,
    end_date: planEndDate,
    phases,
  }
}
