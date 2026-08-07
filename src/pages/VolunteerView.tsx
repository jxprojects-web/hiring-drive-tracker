import { useCandidates, useSettings } from '../lib/useRealtime'
import { STAGE_LABELS, CandidateStage } from '../types'
import { StageBadge } from '../components/StageBadge'
import { statusBadgeFor } from './Dashboard'
import { formatTime } from '../lib/time'

const STAGES: CandidateStage[] = ['reception', 'hr_screening', 'cabin_1', 'cabin_2', 'cabin_3', 'cabin_4', 'loi']

export function VolunteerView() {
  const { candidates, loading } = useCandidates()
  const settings = useSettings()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand px-4 py-3 shadow">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-lg font-bold text-white">Live Hiring Queue</h1>
          <p className="text-xs text-white/70">Read-only view — no login required. Refreshes automatically.</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((stage) => {
              const queue = candidates.filter((c) => c.stage === stage)
              return (
                <div key={stage} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <StageBadge stage={stage} />
                    <span className="text-xs font-semibold text-gray-400">{queue.length}</span>
                  </div>
                  {queue.length === 0 ? (
                    <p className="text-xs text-gray-400">Empty</p>
                  ) : (
                    <ul className="space-y-2">
                      {queue.map((c) => (
                        <li key={c.id} className="rounded-md border border-gray-100 p-2">
                          <p className="text-sm font-medium text-gray-800">{c.full_name}</p>
                          <p className="text-xs text-gray-400">
                            {c.candidate_code} · {formatTime(c.registered_at)}
                          </p>
                          <div className="mt-1">{statusBadgeFor(c, settings)}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
        <p className="mt-6 text-center text-xs text-gray-400">
          Stages: {STAGES.map((s) => STAGE_LABELS[s]).join(' → ')} → Completed
        </p>
      </main>
    </div>
  )
}
