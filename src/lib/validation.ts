import { z } from 'zod'

// ── Primitives ─────────────────────────────────────────────────────────────
export const rpeSchema = z.number().int().min(1).max(10)
export const energySchema = z.number().int().min(1).max(10)

const safePositiveInt = z.number().int().positive().safe()
const safePositiveNumber = z.number().positive().safe()

// ── Run ────────────────────────────────────────────────────────────────────
export const runResultSchema = z.object({
  distanceMeters:  safePositiveInt,
  durationSeconds: safePositiveInt,
  avgPaceSeconds:  safePositiveInt,
  avgHeartRate:    safePositiveInt.optional(),
  rpe:             rpeSchema,
})
export type RunResultInput = z.infer<typeof runResultSchema>

// ── Interval rep ───────────────────────────────────────────────────────────
export const intervalRepSchema = z.object({
  repNumber:       safePositiveInt,
  durationSeconds: safePositiveInt,
  distanceMeters:  safePositiveInt,
})
export type IntervalRepInput = z.infer<typeof intervalRepSchema>

// ── Gym set ────────────────────────────────────────────────────────────────
export const gymSetSchema = z.object({
  setNumber:     safePositiveInt,
  weightKg:      safePositiveNumber,
  repsCompleted: safePositiveInt,
  rpe:           rpeSchema.optional(),
})
export type GymSetInput = z.infer<typeof gymSetSchema>

// ── Recovery reflection ────────────────────────────────────────────────────
export const recoveryReflectionSchema = z.object({
  rpe:          rpeSchema,
  energyLevel:  energySchema,
  mood:         z.number().int().min(1).max(10),
  sleepQuality: z.number().int().min(1).max(10),
  painLevel:    z.number().int().min(1).max(10),
  notes:        z.string().max(500).optional(),
})
export type RecoveryReflectionInput = z.infer<typeof recoveryReflectionSchema>

// ── Sanitizer ─────────────────────────────────────────────────────────────
export function sanitizeText(raw: string): string {
  return raw
    .trim()
    .replace(/<[^>]*>/g, '')   // strip HTML tags
    .slice(0, 500)
}
