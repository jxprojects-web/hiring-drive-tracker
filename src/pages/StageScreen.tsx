import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCandidates, useSettings } from '../lib/useRealtime'
import { supabase } from '../lib/supabase'
import { Candidate, CandidateStage, STAGE_LABELS } from '../types'
import { StageBadge } from '../components/StageBadge'
import { statusBadgeFor } from './Dashboard'
import { formatTime } from '../lib/time'
import { ReceptionForm } from '../components/ReceptionForm'
import { HrPanel } from '../components/HrPanel'
import { CabinPanel } from '../components/CabinPanel'
import { LoiPanel } from '../components/LoiPanel'
import { QueueLog } from '../components/QueueLog'

export function StageScreen() {
  const { stage } = useParams<{ stage: CandidateStage }>()
  const { profile } = useAuth()
  const { candidates, loading } = useCandidates()
  const settings = useSettings()
  const [selected, setSelected] = useState<Candidate | null>(null)

  if (!stage) return null

  const queue = candidates
    .filter((c) => c.stage === stage)
    .sort((a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime())

  const showLog = stage !== 'reception'

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-bold text-brand">
            <StageBadge stage={stage} /> Queue ({queue.length})
          </h1>
        </div>

        {stage === 'reception' && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Register New Candidate</h2>
            <ReceptionForm createdBy={profile?.id ?? null} />
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : queue.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
            No candidates currently at {STAGE_LABELS[stage]}.
          </p>
        ) : (
          <ul className="space-y-2">
            {queue.map((c) => (
              <li
                key={c.id}
                onClick={() => setSelected(c)}
                className={`cursor-pointer rounded-lg border p-3 shadow-sm transition-colors ${
                  selected?.id === c.id ? 'border-brand bg-brand/5' : 'border-gray-200 bg-white hover:border-brand/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      {c.full_name} <span className="ml-1 font-mono text-xs text-gray-400">{c.candidate_code}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.position_applied} · {c.phone} · Registered {formatTime(c.registered_at)}
                    </p>
                  </div>
                  {statusBadgeFor(c, settings)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="sticky top-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Actions</h2>
          {!selected ? (
            <p className="text-sm text-gray-400">Select a candidate from the queue to act on them.</p>
          ) : (
            <ActionPanel stage={stage} candidate={selected} onDone={() => setSelected(null)} />
          )}
        </div>
      </div>
      </div>
      {showLog && <QueueLog stage={stage} candidates={candidates} />}
    </div>
  )
}

function ActionPanel({
  stage,
  candidate,
  onDone,
}: {
  stage: CandidateStage
  candidate: Candidate
  onDone: () => void
}) {
  if (stage === 'reception') return <ReceptionQueueActions candidate={candidate} onDone={onDone} />
  if (stage === 'hr_screening') return <HrPanel candidate={candidate} onDone={onDone} />
  if (stage === 'cabin_1' || stage === 'cabin_2' || stage === 'cabin_3' || stage === 'cabin_4')
    return <CabinPanel candidate={candidate} onDone={onDone} />
  if (stage === 'loi') return <LoiPanel candidate={candidate} onDone={onDone} />
  return <p className="text-sm text-gray-400">No actions available for this stage.</p>
}

function ReceptionQueueActions({ candidate, onDone }: { candidate: Candidate; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function sendToHr() {
    if (!candidate.resume_received || !candidate.registration_complete) {
      setError('Cannot proceed: resume received and registration complete must both be checked first.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.from('candidates').update({ stage: 'hr_screening' }).eq('id', candidate.id)
    setSubmitting(false)
    if (error) setError(error.message)
    else onDone()
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-800">{candidate.full_name}</p>
      <dl className="space-y-1 text-xs text-gray-500">
        <div>Resume received: {candidate.resume_received ? 'Yes' : 'No'}</div>
        <div>Registration complete: {candidate.registration_complete ? 'Yes' : 'No'}</div>
      </dl>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">{error}</p>}
      <button
        onClick={sendToHr}
        disabled={submitting}
        className="w-full rounded-md bg-stage-hr px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? 'Sending…' : 'Send to HR Screening →'}
      </button>
    </div>
  )
}
