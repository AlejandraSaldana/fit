import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { PersonalRecord } from '../lib/supabase'

export function usePersonalRecords(userId: string) {
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', userId)
        .order('achieved_date', { ascending: false })

      if (!mounted) return
      setRecords(data ?? [])
      setLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [userId])

  return { records, loading }
}
