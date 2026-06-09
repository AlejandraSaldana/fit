import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { WhoopRecovery } from '../lib/supabase'

function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function useWhoopRecovery(userId: string) {
  const [recovery, setRecovery] = useState<WhoopRecovery | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const today = toDateString(new Date())

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('whoop_recovery')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle()

      if (!mounted) return
      setRecovery(data)
      setLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [userId])

  return { recovery, loading }
}
