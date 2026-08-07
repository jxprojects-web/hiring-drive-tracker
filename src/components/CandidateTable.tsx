import { useMemo, useState } from 'react'
import { Candidate } from '../types'
import { StageBadge } from './StageBadge'
import { formatDateTime } from '../lib/time'

export function CandidateTable({ candidates }: { candidates: Candidate[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = q
      ? candidates.filter(
          (c) =>
            c.full_name.toLowerCase().includes(q) ||
            c.candidate_code.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.position_applied.toLowerCase().includes(q)
        )
      : candidates
    return [...rows].sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime())
  }, [candidates, query])

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-700">
          Live Candidate Table <span className="font-normal text-gray-400">({filtered.length})</span>
        </h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, code, phone, position…"
          className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Updates live as staff move candidates through stages. Use this to check the data before exporting.
      </p>

      <div className="mt-3 max-h-[32rem] overflow-auto rounded-md border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="sticky top-0 bg-gray-50">
            <tr className="text-left font-medium uppercase text-gray-500">
              <th className="whitespace-nowrap px-3 py-2">Code</th>
              <th className="whitespace-nowrap px-3 py-2">Name</th>
              <th className="whitespace-nowrap px-3 py-2">Phone</th>
              <th className="whitespace-nowrap px-3 py-2">Position</th>
              <th className="whitespace-nowrap px-3 py-2">Exp (yrs)</th>
              <th className="whitespace-nowrap px-3 py-2">Stage</th>
              <th className="whitespace-nowrap px-3 py-2">HR Feedback</th>
              <th className="whitespace-nowrap px-3 py-2">Rating</th>
              <th className="whitespace-nowrap px-3 py-2">Interview Comments</th>
              <th className="whitespace-nowrap px-3 py-2">LOI</th>
              <th className="whitespace-nowrap px-3 py-2">Aadhaar</th>
              <th className="whitespace-nowrap px-3 py-2">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-6 text-center text-gray-400">
                  No candidates match your search.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-gray-500">{c.candidate_code}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-800">{c.full_name}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">{c.phone}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">{c.position_applied}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">{c.experience_years}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <StageBadge stage={c.stage} />
                  </td>
                  <td className="max-w-[14rem] truncate px-3 py-2 text-gray-600" title={c.hr_feedback ?? ''}>
                    {c.hr_feedback ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                    {c.interview_rating ? `${c.interview_rating}/5` : '—'}
                  </td>
                  <td className="max-w-[14rem] truncate px-3 py-2 text-gray-600" title={c.interview_comments ?? ''}>
                    {c.interview_comments ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">{c.loi_issued ? 'Yes' : 'No'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">{c.aadhaar_received ? 'Yes' : 'No'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-500">{formatDateTime(c.registered_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        Showing the fields most useful for a quick check. Use the export buttons below for the complete record with
        every field.
      </p>
    </section>
  )
}
