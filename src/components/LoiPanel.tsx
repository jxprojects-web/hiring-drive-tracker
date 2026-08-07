import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Candidate } from '../types'

export function LoiPanel({ candidate, onDone }: { candidate: Candidate; onDone: () => void }) {
  const [loiIssued, setLoiIssued] = useState(candidate.loi_issued)
  const [aadhaarReceived, setAadhaarReceived] = useState(candidate.aadhaar_received)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function save() {
    setSubmitting(true)
    const { error } = await supabase
      .from('candidates')
      .update({ loi_issued: loiIssued, aadhaar_received: aadhaarReceived })
      .eq('id', candidate.id)
    setSubmitting(false)
    if (error) setError(error.message)
  }

  async function markCompleted() {
    if (!loiIssued || !aadhaarReceived) {
      setError('LOI must be issued and Aadhaar received before marking complete.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error } = await supabase
      .from('candidates')
      .update({
        loi_issued: true,
        aadhaar_received: true,
        exit_time: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        stage: 'completed',
      })
      .eq('id', candidate.id)
    setSubmitting(false)
    if (error) setError(error.message)
    else onDone()
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-800">{candidate.full_name}</p>
      <p className="text-xs text-gray-500">
        {candidate.position_applied} · Rating {candidate.interview_rating ?? '—'}/5 ·{' '}
        {candidate.interview_recommendation ?? '—'}
      </p>

      {candidate.interview_comments && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Interviewer Feedback</p>
          <p className="mt-1 whitespace-pre-wrap text-xs text-gray-700">{candidate.interview_comments}</p>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={loiIssued}
          onChange={(e) => {
            setLoiIssued(e.target.checked)
          }}
          onBlur={save}
        />
        LOI issued
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={aadhaarReceived}
          onChange={(e) => {
            setAadhaarReceived(e.target.checked)
          }}
          onBlur={save}
        />
        Aadhaar received
      </label>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">{error}</p>}

      <button
        onClick={async () => {
          await save()
          await markCompleted()
        }}
        disabled={submitting}
        className="w-full rounded-md bg-stage-completed px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        Mark Completed (records exit time) →
      </button>
    </div>
  )
}
