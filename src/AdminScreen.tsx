import { useEffect, useState } from 'react'
import { useCandidates, useSettings } from '../lib/useRealtime'
import { exportToCsv, exportToXlsx } from '../lib/export'
import { supabase } from '../lib/supabase'
import { Profile, ROLE_LABELS } from '../types'
import { CandidateTable } from '../components/CandidateTable'

export function AdminScreen() {
  const { candidates } = useCandidates()
  const settings = useSettings()

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-brand">Admin</h1>
      <CandidateTable candidates={candidates} />
      <ExportSection count={candidates.length} candidates={candidates} />
      <SettingsSection settings={settings} />
      <RosterSection />
      <ResetSection candidates={candidates} />
    </div>
  )
}

function ExportSection({ count, candidates }: { count: number; candidates: ReturnType<typeof useCandidates>['candidates'] }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700">Export Candidates</h2>
      <p className="mt-1 text-xs text-gray-500">{count} candidates currently in the system. Generated in your browser — no server involved.</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => exportToXlsx(candidates)}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light"
        >
          Download .xlsx
        </button>
        <button
          onClick={() => exportToCsv(candidates)}
          className="rounded-md border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand/5"
        >
          Download .csv
        </button>
      </div>
    </section>
  )
}

function SettingsSection({ settings }: { settings: ReturnType<typeof useSettings> }) {
  const [hrWait, setHrWait] = useState(15)
  const [interviewDuration, setInterviewDuration] = useState(20)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setHrWait(settings.hr_wait_threshold_minutes)
      setInterviewDuration(settings.interview_duration_threshold_minutes)
    }
  }, [settings])

  async function save() {
    setSaving(true)
    setSaved(false)
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('settings')
      .update({
        hr_wait_threshold_minutes: hrWait,
        interview_duration_threshold_minutes: interviewDuration,
        updated_by: userData.user?.id,
      })
      .eq('id', 1)
    setSaving(false)
    if (!error) setSaved(true)
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700">Alert Thresholds</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-600">HR wait threshold (minutes)</label>
          <input
            type="number"
            min={1}
            value={hrWait}
            onChange={(e) => setHrWait(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">Interview duration threshold (minutes)</label>
          <input
            type="number"
            min={1}
            value={interviewDuration}
            onChange={(e) => setInterviewDuration(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
          />
        </div>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-light disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Thresholds'}
      </button>
      {saved && <span className="ml-3 text-xs text-green-600">Saved.</span>}
    </section>
  )
}

function RosterSection() {
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('email')
      .then(({ data }) => data && setProfiles(data as Profile[]))
  }, [])

  async function changeRole(id: string, role: Profile['role']) {
    await supabase.from('profiles').update({ role }).eq('id', id)
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)))
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700">Staff Roster</h2>
      <p className="mt-1 text-xs text-gray-500">
        New sign-ups default to "Reception". Assign the correct role for each staff member below. To add a brand-new
        staff login, create the user in Supabase Auth first (see README) — they'll appear here automatically.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr className="text-left text-xs font-medium uppercase text-gray-500">
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {profiles.map((p) => (
              <tr key={p.id}>
                <td className="py-2 pr-4">{p.email}</td>
                <td className="py-2 pr-4">
                  <select
                    value={p.role}
                    onChange={(e) => changeRole(p.id, e.target.value as Profile['role'])}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ResetSection({ candidates }: { candidates: ReturnType<typeof useCandidates>['candidates'] }) {
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [resetting, setResetting] = useState(false)
  const [done, setDone] = useState(false)

  async function doReset() {
    setResetting(true)
    exportToXlsx(candidates) // force an export first
    const { error } = await supabase.rpc('reset_event_data')
    setResetting(false)
    if (!error) {
      setDone(true)
      setConfirming(false)
      setConfirmText('')
    }
  }

  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-red-800">Reset for Next Event</h2>
      <p className="mt-1 text-xs text-red-700">
        Downloads a full .xlsx export, then permanently deletes all candidates and activity log entries. This cannot
        be undone.
      </p>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="mt-3 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
        >
          Reset Event Data…
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-red-800">
            Type <strong>RESET</strong> to confirm you want to export and permanently clear all data.
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full rounded-md border border-red-300 px-3 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={doReset}
              disabled={confirmText !== 'RESET' || resetting}
              className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-40"
            >
              {resetting ? 'Resetting…' : 'Confirm Export & Reset'}
            </button>
            <button
              onClick={() => {
                setConfirming(false)
                setConfirmText('')
              }}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {done && <p className="mt-3 text-xs font-medium text-green-700">Reset complete. Export was downloaded first.</p>}
    </section>
  )
}
