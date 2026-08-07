import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useCandidates, useSettings } from '../lib/useRealtime'
import { Candidate, CandidateStage, STAGE_LABELS } from '../types'
import { KpiCard } from '../components/KpiCard'
import { StageBadge } from '../components/StageBadge'
import { AlertBadge } from '../components/AlertBadge'
import { avgMinutes, formatMinutes, minutesSince, formatTime } from '../lib/time'

const FUNNEL_STAGES: CandidateStage[] = [
  'reception', 'hr_screening', 'cabin_1', 'cabin_2', 'cabin_3', 'cabin_4', 'loi', 'completed',
]

const PIE_COLORS: Record<string, string> = {
  Selected: '#16a34a',
  Rejected: '#6b7280',
  'In Progress': '#2563eb',
}

export function Dashboard() {
  const { candidates, loading } = useCandidates()
  const settings = useSettings()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return candidates
    const q = query.toLowerCase()
    return candidates.filter(
      (c) =>
        c.candidate_code.toLowerCase().includes(q) ||
        c.full_name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.position_applied.toLowerCase().includes(q)
    )
  }, [candidates, query])

  const kpis = useMemo(() => computeKpis(candidates), [candidates])

  const funnelData = FUNNEL_STAGES.map((stage) => ({
    stage: STAGE_LABELS[stage],
    count: candidates.filter((c) => c.stage === stage).length,
  }))

  const outcomeData = [
    { name: 'Selected', value: candidates.filter((c) => c.stage === 'completed').length },
    { name: 'Rejected', value: candidates.filter((c) => c.stage === 'rejected').length },
    {
      name: 'In Progress',
      value: candidates.filter((c) => c.stage !== 'completed' && c.stage !== 'rejected').length,
    },
  ]

  const hourlyData = useMemo(() => {
    const buckets = new Map<string, number>()
    candidates.forEach((c) => {
      const d = new Date(c.registered_at)
      const key = `${d.getHours().toString().padStart(2, '0')}:00`
      buckets.set(key, (buckets.get(key) ?? 0) + 1)
    })
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, count]) => ({ hour, count }))
  }, [candidates])

  const currentPerTouchpoint = FUNNEL_STAGES.filter((s) => s !== 'reception' && s !== 'completed').map((stage) => ({
    stage,
    candidate: candidates.find((c) => c.stage === stage) ?? null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand">Live Dashboard</h1>
        <input
          type="text"
          placeholder="Search by ID, name, phone, position…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-80 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard label="Registered" value={kpis.registered} />
            <KpiCard label="Waiting HR" value={kpis.waitingHr} />
            <KpiCard label="HR In Progress" value={kpis.hrInProgress} />
            <KpiCard label="Waiting Interview" value={kpis.waitingInterview} />
            <KpiCard label="Interview In Progress" value={kpis.interviewInProgress} />
            <KpiCard label="Offered / LOI" value={kpis.loi} />
            <KpiCard label="Rejected" value={kpis.rejected} />
            <KpiCard label="Completed" value={kpis.completed} />
            <KpiCard label="Avg HR Time" value={formatMinutes(kpis.avgHrTime)} />
            <KpiCard label="Avg Interview Time" value={formatMinutes(kpis.avgInterviewTime)} />
            <KpiCard label="Avg Total Time" value={formatMinutes(kpis.avgTotalTime)} />
            <KpiCard label="Cabin Utilization" value={`${kpis.cabinUtilizationPct}%`} sub="of 4 cabins active" />
          </div>

          {/* Current candidate per touchpoint */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">Current Candidate per Touchpoint</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {currentPerTouchpoint.map(({ stage, candidate }) => (
                <div key={stage} className="rounded-md border border-gray-100 p-3">
                  <StageBadge stage={stage} />
                  {candidate ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-800">{candidate.full_name}</p>
                      <p className="text-xs text-gray-400">{candidate.candidate_code}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">Empty</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:col-span-2">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">Pipeline Funnel</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">Outcome Split</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={outcomeData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {outcomeData.map((entry) => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:col-span-3">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">Hourly Registrations</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Search results table */}
          {query.trim() && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">
                Search results ({filtered.length})
              </h2>
              <SearchTable candidates={filtered} thresholds={settings} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SearchTable({
  candidates,
  thresholds,
}: {
  candidates: Candidate[]
  thresholds: { hr_wait_threshold_minutes: number; interview_duration_threshold_minutes: number } | null
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead>
          <tr className="text-left text-xs font-medium uppercase text-gray-500">
            <th className="py-2 pr-4">Code</th>
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Phone</th>
            <th className="py-2 pr-4">Position</th>
            <th className="py-2 pr-4">Stage</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Registered</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {candidates.map((c) => {
            const badge = statusBadgeFor(c, thresholds)
            return (
              <tr key={c.id}>
                <td className="py-2 pr-4 font-mono text-xs">{c.candidate_code}</td>
                <td className="py-2 pr-4 font-medium">{c.full_name}</td>
                <td className="py-2 pr-4">{c.phone}</td>
                <td className="py-2 pr-4">{c.position_applied}</td>
                <td className="py-2 pr-4">
                  <StageBadge stage={c.stage} />
                </td>
                <td className="py-2 pr-4">{badge}</td>
                <td className="py-2 pr-4">{formatTime(c.registered_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function statusBadgeFor(
  c: Candidate,
  thresholds: { hr_wait_threshold_minutes: number; interview_duration_threshold_minutes: number } | null
) {
  if (c.stage === 'completed') return <AlertBadge kind="completed" label="Completed" />
  if (c.stage === 'reception' && (!c.resume_received || !c.registration_complete)) {
    return <AlertBadge kind="incomplete" label="Incomplete fields" />
  }
  if (c.stage === 'hr_screening' && !c.hr_started_at && thresholds) {
    const waited = minutesSince(c.registered_at) ?? 0
    if (waited > thresholds.hr_wait_threshold_minutes) return <AlertBadge kind="waiting" label={`Waiting ${waited}m`} />
  }
  if (['cabin_1', 'cabin_2', 'cabin_3', 'cabin_4'].includes(c.stage) && c.cabin_started_at && thresholds) {
    const elapsed = minutesSince(c.cabin_started_at) ?? 0
    if (elapsed > thresholds.interview_duration_threshold_minutes)
      return <AlertBadge kind="interview" label={`In cabin ${elapsed}m`} />
  }
  return <AlertBadge kind="ok" label="On track" />
}

function computeKpis(candidates: Candidate[]) {
  const registered = candidates.length
  const waitingHr = candidates.filter((c) => c.stage === 'hr_screening' && !c.hr_started_at).length
  const hrInProgress = candidates.filter((c) => c.stage === 'hr_screening' && c.hr_started_at && !c.hr_completed_at).length
  const cabinStages: CandidateStage[] = ['cabin_1', 'cabin_2', 'cabin_3', 'cabin_4']
  const waitingInterview = candidates.filter((c) => cabinStages.includes(c.stage) && !c.cabin_started_at).length
  const interviewInProgress = candidates.filter(
    (c) => cabinStages.includes(c.stage) && c.cabin_started_at && !c.cabin_completed_at
  ).length
  const loi = candidates.filter((c) => c.stage === 'loi').length
  const rejected = candidates.filter((c) => c.stage === 'rejected').length
  const completed = candidates.filter((c) => c.stage === 'completed').length

  const avgHrTime = avgMinutes(candidates.map((c) => [c.hr_started_at, c.hr_completed_at]))
  const avgInterviewTime = avgMinutes(candidates.map((c) => [c.cabin_started_at, c.cabin_completed_at]))
  const avgTotalTime = avgMinutes(candidates.map((c) => [c.registered_at, c.completed_at]))

  const activeCabins = new Set(
    candidates.filter((c) => cabinStages.includes(c.stage) && c.cabin_started_at && !c.cabin_completed_at).map((c) => c.cabin_number)
  ).size
  const cabinUtilizationPct = Math.round((activeCabins / 4) * 100)

  return {
    registered, waitingHr, hrInProgress, waitingInterview, interviewInProgress,
    loi, rejected, completed, avgHrTime, avgInterviewTime, avgTotalTime, cabinUtilizationPct,
  }
}
