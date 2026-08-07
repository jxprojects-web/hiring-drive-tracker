import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Candidate } from '../types'
const HR_NAMES = [
  'Rushi',
  'Nirali',
]

export function HrPanel({ candidate, onDone }: { candidate: Candidate; onDone: () => void }) {
  const [feedback, setFeedback] = useState(candidate.hr_feedback ?? '')
  const [hrName, setHrName] = useState(
    candidate.hr_interviewer ?? 'Rushi'
)
  const [cabin, setCabin] = useState<'1' | '2' | '3' | '4'>('1')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isExperienced = candidate.experience_years > 0

  async function startScreening() {
    setSubmitting(true)
    const { error } = await supabase
      .from('candidates')
      .update({ hr_started_at: new Date().toISOString() })
      .eq('id', candidate.id)
    setSubmitting(false)
    if (error) setError(error.message)
  }

  async function assignToCabin() {
    if (cabin === '4' && !isExperienced) {
      setError('Cabin 4 is for experienced candidates only. Choose a different cabin.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error } = await supabase
      .from('candidates')
const history =
${candidate.comments_history ?? ''}

========================
HR (${hrName})
${feedback}

.update({

    hr_feedback: feedback || null,

    hr_interviewer: hrName,

    comments_history: history,

    hr_completed_at:new Date().toISOString(),

    cabin_number:Number(cabin),

    stage:(`cabin_${cabin}` as Candidate['stage'])

      .eq('id', candidate.id)
    setSubmitting(false)
    if (error) setError(error.message)
    else onDone()
  }

  async function reject() {
    setSubmitting(true)
    setError(null)
    const { error } = await supabase
      .from('candidates')
   const history =
${candidate.comments_history ?? ''}

========================
HR (${hrName})
REJECTED

${feedback}

.update({

    hr_feedback:feedback,

    hr_interviewer:hrName,

    comments_history:history,
      .eq('id', candidate.id)
    setSubmitting(false)
    if (error) setError(error.message)
    else onDone()
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-800">{candidate.full_name}</p>
        <p className="text-xs text-gray-500">
          {candidate.position_applied} · {candidate.experience_years}yrs exp
          {isExperienced ? '' : ' (fresher — Cabin 4 not eligible)'}
        </p>
      </div>

      {!candidate.hr_started_at ? (
        <button
          onClick={startScreening}
          disabled={submitting}
          className="w-full rounded-md bg-stage-hr px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Start Screening
        </button>
      ) : (
        <>
                    <div>
                <label className="block text-xs font-medium text-gray-600">
                    HR Name
                </label>

                <select
                    value={hrName}
                    onChange={(e)=>setHrName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                >
                    {HR_NAMES.map(name=>(
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
            </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">HR Feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Assign to Cabin</label>
            <select
              value={cabin}
              onChange={(e) => setCabin(e.target.value as typeof cabin)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
            >
              <option value="1">Cabin 1</option>
              <option value="2">Cabin 2</option>
              <option value="3">Cabin 3</option>
              <option value="4" disabled={!isExperienced}>
                Cabin 4 {isExperienced ? '' : '(experienced only)'}
              </option>
            </select>
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={assignToCabin}
              disabled={submitting}
              className="flex-1 rounded-md bg-stage-cabin1 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Send to Cabin →
            </button>
            <button
              onClick={reject}
              disabled={submitting}
              className="flex-1 rounded-md bg-stage-rejected px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </>
      )}
    </div>
  )
}
