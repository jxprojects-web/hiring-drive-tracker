import { Candidate, CandidateStage, STAGE_LABELS } from '../types'
import { formatDateTime } from '../lib/time'
import { StageBadge } from './StageBadge'

interface LogRow {
  candidate: Candidate
  when: string
  destination: CandidateStage
  feedback: string | null
  extra?: string | null
}

/**
 * Derives a "who did we send where, with what feedback" log directly from the
 * already-realtime candidates list — no extra query needed, and it updates
 * live the same way the queue above it does.
 */
function buildLog(stage: CandidateStage, candidates: Candidate[]): LogRow[] {
  let rows: LogRow[] = []

  if (stage === 'hr_screening') {
    rows = candidates
      .filter((c) => c.hr_completed_at || c.rejected_at_stage === 'hr_screening')
      .map((c) => ({
        candidate: c,
        when: c.hr_completed_at ?? c.updated_at,
        destination: c.rejected_at_stage === 'hr_screening' ? 'rejected' : (`cabin_${c.cabin_number}` as CandidateStage),
        feedback: c.hr_feedback,
      }))
  } else if (stage === 'cabin_1' || stage === 'cabin_2' || stage === 'cabin_3' || stage === 'cabin_4') {
    const cabinNum = Number(stage.split('_')[1])
    rows = candidates
      .filter((c) => c.cabin_number === cabinNum && c.cabin_completed_at)
      .map((c) => ({
        candidate: c,
        when: c.cabin_completed_at as string,
        destination: c.interview_recommendation === 'reject' ? 'rejected' : 'loi',
        feedback: c.interview_comments,
        extra: c.interview_rating ? `Rating ${c.interview_rating}/5` : null,
      }))
  } else if (stage === 'loi') {
    rows = candidates
      .filter((c) => c.stage === 'completed')
      .map((c) => ({
        candidate: c,
        when: c.completed_at as string,
        destination: 'completed',
        feedback: null,
        extra: `LOI issued · Aadhaar received · Exit ${formatDateTime(c.exit_time)}`,
      }))
  }

  return rows.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()).slice(0, 25)
}

export function QueueLog({ stage, candidates }: { stage: CandidateStage; candidates: Candidate[] }) {
  const rows = buildLog(stage, candidates)

  return (
    <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700">
        Recent Decisions from {STAGE_LABELS[stage]} <span className="font-normal text-gray-400">({rows.length})</span>
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">No decisions recorded yet from this desk.</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100">
          {rows.map((row) => (
            <li key={row.candidate.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{row.candidate.full_name}</span>
                  <span className="font-mono text-xs text-gray-400">{row.candidate.candidate_code}</span>
                  <span className="text-xs text-gray-400">→</span>
                  <StageBadge stage={row.destination} />
                </div>
                <span className="text-xs text-gray-400">{formatDateTime(row.when)}</span>
              </div>
              {row.feedback && (
                <p className="mt-1.5 whitespace-pre-wrap rounded-md bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600">
                  {row.feedback}
                </p>
              )}
              {row.extra && <p className="mt-1 text-xs text-gray-400">{row.extra}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
