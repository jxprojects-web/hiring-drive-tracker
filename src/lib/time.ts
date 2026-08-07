export function minutesSince(iso: string | null): number | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  return Math.floor((Date.now() - then) / 60000)
}

export function formatMinutes(mins: number | null): string {
  if (mins === null) return '—'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  })
}

export function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function avgMinutes(pairs: Array<[string | null, string | null]>): number | null {
  const durations = pairs
    .filter(([a, b]) => a && b)
    .map(([a, b]) => (new Date(b as string).getTime() - new Date(a as string).getTime()) / 60000)
  if (durations.length === 0) return null
  return Math.round(durations.reduce((s, v) => s + v, 0) / durations.length)
}
