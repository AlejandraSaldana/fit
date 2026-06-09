import { createClient } from '@supabase/supabase-js'

// ── Enums ──────────────────────────────────────────────────────────────────
export const WorkoutType = {
  run: 'run',
  gym: 'gym',
  rest: 'rest',
  time_trial: 'time_trial',
} as const
export type WorkoutType = (typeof WorkoutType)[keyof typeof WorkoutType]

export const WorkoutStatus = {
  planned: 'planned',
  completed: 'completed',
  missed: 'missed',
} as const
export type WorkoutStatus = (typeof WorkoutStatus)[keyof typeof WorkoutStatus]

export const RunType = {
  easy: 'easy',
  tempo: 'tempo',
  interval: 'interval',
  time_trial: 'time_trial',
} as const
export type RunType = (typeof RunType)[keyof typeof RunType]

export const RecordType = {
  '1km': '1km',
  '400m': '400m',
  longest_run: 'longest_run',
} as const
export type RecordType = (typeof RecordType)[keyof typeof RecordType]

// ── Database shape ─────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          whoop_connected: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          whoop_connected?: boolean
          created_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          user_id: string
          name: string
          goal: string | null
          goal_time_seconds: number | null
          current_pb_seconds: number | null
          start_date: string | null
          end_date: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          goal?: string | null
          goal_time_seconds?: number | null
          current_pb_seconds?: number | null
          start_date?: string | null
          end_date?: string | null
          status?: string
          created_at?: string
        }
      }
      phases: {
        Row: {
          id: string
          plan_id: string
          name: string
          order_index: number | null
          start_week: number | null
          end_week: number | null
        }
        Insert: {
          id?: string
          plan_id: string
          name: string
          order_index?: number | null
          start_week?: number | null
          end_week?: number | null
        }
      }
      workouts: {
        Row: {
          id: string
          plan_id: string
          phase_id: string | null
          user_id: string
          scheduled_date: string
          type: string
          name: string
          duration_mins: number | null
          coach_note: string | null
          status: string
        }
        Insert: {
          id?: string
          plan_id: string
          phase_id?: string | null
          user_id: string
          scheduled_date: string
          type: string
          name: string
          duration_mins?: number | null
          coach_note?: string | null
          status?: string
        }
      }
      exercises: {
        Row: {
          id: string
          workout_id: string
          name: string
          order_index: number | null
          sets: number | null
          reps: number | null
          target_weight_kg: number | null
        }
        Insert: {
          id?: string
          workout_id: string
          name: string
          order_index?: number | null
          sets?: number | null
          reps?: number | null
          target_weight_kg?: number | null
        }
      }
      workout_sessions: {
        Row: {
          id: string
          workout_id: string
          user_id: string
          completed_at: string
          rpe: number | null
          energy_level: number | null
          mood: number | null
          sleep_quality: number | null
          pain_level: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          workout_id: string
          user_id: string
          completed_at?: string
          rpe?: number | null
          energy_level?: number | null
          mood?: number | null
          sleep_quality?: number | null
          pain_level?: number | null
          notes?: string | null
        }
      }
      run_results: {
        Row: {
          id: string
          session_id: string
          user_id: string
          run_type: string | null
          distance_meters: number | null
          duration_seconds: number | null
          avg_pace_seconds: number | null
          avg_heart_rate: number | null
          rpe: number | null
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          run_type?: string | null
          distance_meters?: number | null
          duration_seconds?: number | null
          avg_pace_seconds?: number | null
          avg_heart_rate?: number | null
          rpe?: number | null
        }
      }
      exercise_sets: {
        Row: {
          id: string
          session_id: string
          exercise_id: string
          set_number: number | null
          weight_kg: number | null
          reps_completed: number | null
        }
        Insert: {
          id?: string
          session_id: string
          exercise_id: string
          set_number?: number | null
          weight_kg?: number | null
          reps_completed?: number | null
        }
      }
      whoop_recovery: {
        Row: {
          id: string
          user_id: string
          date: string
          recovery_score: number | null
          hrv_ms: number | null
          resting_hr: number | null
          sleep_performance: number | null
          strain_score: number | null
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          recovery_score?: number | null
          hrv_ms?: number | null
          resting_hr?: number | null
          sleep_performance?: number | null
          strain_score?: number | null
        }
      }
      personal_records: {
        Row: {
          id: string
          user_id: string
          record_type: string | null
          value_seconds: number | null
          achieved_date: string | null
          session_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          record_type?: string | null
          value_seconds?: number | null
          achieved_date?: string | null
          session_id?: string | null
        }
      }
    }
  }
}

// ── Exported Row / Insert convenience types ────────────────────────────────
type Tables = Database['public']['Tables']

export type Profile        = Tables['profiles']['Row']
export type ProfileInsert  = Tables['profiles']['Insert']

export type Plan           = Tables['plans']['Row']
export type PlanInsert     = Tables['plans']['Insert']

export type Phase          = Tables['phases']['Row']
export type PhaseInsert    = Tables['phases']['Insert']

export type Workout        = Tables['workouts']['Row']
export type WorkoutInsert  = Tables['workouts']['Insert']

export type Exercise       = Tables['exercises']['Row']
export type ExerciseInsert = Tables['exercises']['Insert']

export type WorkoutSession       = Tables['workout_sessions']['Row']
export type WorkoutSessionInsert = Tables['workout_sessions']['Insert']

export type RunResult       = Tables['run_results']['Row']
export type RunResultInsert = Tables['run_results']['Insert']

export type ExerciseSet       = Tables['exercise_sets']['Row']
export type ExerciseSetInsert = Tables['exercise_sets']['Insert']

export type WhoopRecovery       = Tables['whoop_recovery']['Row']
export type WhoopRecoveryInsert = Tables['whoop_recovery']['Insert']

export type PersonalRecord       = Tables['personal_records']['Row']
export type PersonalRecordInsert = Tables['personal_records']['Insert']

// ── Client ─────────────────────────────────────────────────────────────────
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient<Database>(supabaseUrl, supabaseAnon)
