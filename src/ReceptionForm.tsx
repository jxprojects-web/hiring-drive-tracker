import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabase'

export function ReceptionForm({ createdBy }: { createdBy: string | null }) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [position, setPosition] = useState('')
  const [experience, setExperience] = useState('0')
  const [resumeReceived, setResumeReceived] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setFullName('')
    setPhone('')
    setEmail('')
    setPosition('')
    setExperience('0')
    setResumeReceived(false)
    setRegistrationComplete(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Required-field validation before a candidate can even be created —
    // reception is meant to fully register someone on the spot.
    if (!fullName.trim() || !position.trim() || !phone.trim()) {
      setError('Name, phone, and position applied are required.')
      return
    }
    if (!resumeReceived || !registrationComplete) {
      setError('Resume received and registration complete must both be checked before this candidate can move on.')
      return
    }

    setSubmitting(true)
    const { data: candidateCode, error: codeError } = await supabase
      .rpc("generate_candidate_code");
    if (codeError || !candidateCode) {
  throw new Error(
    codeError?.message ?? "Unable to generate candidate code."
  );
}
    const { error } = await supabase.from('candidates').insert({
      candidate_code: candidateCode,
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      position_applied: position.trim(),
      experience_years: Number(experience) || 0,
      resume_received: resumeReceived,
      registration_complete: registrationComplete,
      stage: 'reception',
      created_by: createdBy,
    })
    setSubmitting(false)

    if (error) {
      // Friendly message for the unique-phone-number constraint.
      if (error.message.includes('duplicate key') || error.message.includes('candidates_phone_key')) {
        setError('A candidate with this phone number is already registered.')
      } else {
        setError(error.message)
      }
      return
    }

    setSuccess(`Registered as ${candidateCode}.`)
    reset()
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="block text-xs font-medium text-gray-600">Full Name *</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600">Phone *</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600">Position Applied *</label>
        <input
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600">Experience (years)</label>
        <input
          type="number"
          min="0"
          step="0.5"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-gray-400">0 = fresher. Only experienced candidates can go to Cabin 4.</p>
      </div>

      <div className="flex items-center gap-4 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={resumeReceived} onChange={(e) => setResumeReceived(e.target.checked)} />
          Resume received
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={registrationComplete}
            onChange={(e) => setRegistrationComplete(e.target.checked)}
          />
          Registration complete
        </label>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200 sm:col-span-2">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-xs text-green-700 border border-green-200 sm:col-span-2">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-stage-reception px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 sm:col-span-2"
      >
        {submitting ? 'Registering…' : 'Register Candidate'}
      </button>
    </form>
  )
}
