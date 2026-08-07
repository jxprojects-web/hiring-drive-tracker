import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Candidate } from '../types'

export function CabinPanel({ candidate, onDone }: { candidate: Candidate; onDone: () => void }) {
  const [rating, setRating] = useState(3)
  const [recommendation, setRecommendation] = useState<'select' | 'hold' | 'reject'>('select')
  const [comments, setComments] = useState(candidate.interview_comments ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function startInterview() {
    setSubmitting(true)
    const { error } = await supabase
      .from('candidates')
      .update({ cabin_started_at: new Date().toISOString() })
      .eq('id', candidate.id)
    setSubmitting(false)
    if (error) setError(error.message)
  }

  async function finishInterview() {
    if (!comments.trim()) {
      setError('Please add detailed feedback before rejecting or sending this candidate forward.')
      return
    }
    setSubmitting(true)
    setError(null)
    const nextStage = recommendation === 'reject' ? 'rejected' : 'loi'
    const { error } = await supabase
      .from('candidates')
      .update({
        cabin_completed_at: new Date().toISOString(),
        interview_rating: rating,
        interview_recommendation: recommendation,
        interview_comments: comments.trim(),
        stage: nextStage,
        ...(nextStage === 'rejected'
          ? { rejected_at_stage: candidate.stage, rejection_reason: comments.trim() }
          : {}),
      })
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
        </p>
      </div>

      {candidate.hr_feedback && (
        <div className="rounded-md border border-purple-200 bg-purple-50 p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-700">HR Screening Comments</p>
          <p className="mt-1 whitespace-pre-wrap text-xs text-purple-900">{candidate.hr_feedback}</p>
        </div>
      )}

      {!candidate.cabin_started_at ? (
        <button
          onClick={startInterview}
          disabled={submitting}
          className="w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
        >
          Start Interview
        </button>
      ) : (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600">Rating (1–5)</label>
            <input
              type="range"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-1 w-full"
            />
            <p className="text-xs text-gray-500">{rating} / 5</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">
              Detailed Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              placeholder="Notes on communication, technical fit, strengths, concerns…"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
            />
            <p className="mt-0.5 text-[11px] text-gray-400">Required before rejecting or sending to LOI.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Recommendation</label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value as typeof recommendation)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
            >
              <option value="select">Select → send to LOI</option>
              <option value="hold">Hold → send to LOI (pending)</option>
              <option value="reject">Reject</option>
            </select>
          </div>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">{error}</p>
          )}

          <button
            onClick={finishInterview}
            disabled={submitting}
            className="w-full rounded-md bg-stage-loi px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {recommendation === 'reject' ? 'Reject Candidate' : 'Send to LOI →'}
          </button>
        </>
      )}
    </div>
  )
}
