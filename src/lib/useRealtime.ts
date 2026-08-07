import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { Candidate, Settings } from '../types'

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('registered_at', { ascending: true })
      if (active && !error && data) setCandidates(data as Candidate[])
      if (active) setLoading(false)
    }
    load()

    const channel = supabase
      .channel('candidates-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidates' },
        (payload) => {
          setCandidates((prev) => {
            if (payload.eventType === 'INSERT') {
              return [...prev, payload.new as Candidate]
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map((c) => (c.id === (payload.new as Candidate).id ? (payload.new as Candidate) : c))
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((c) => c.id !== (payload.old as Candidate).id)
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  return { candidates, loading }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single()
      if (active && !error && data) setSettings(data as Settings)
    }
    load()

    const channel = supabase
      .channel('settings-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, (payload) => {
        setSettings(payload.new as Settings)
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  return settings
}
