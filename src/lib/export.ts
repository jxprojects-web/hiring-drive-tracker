import * as XLSX from 'xlsx'
import { Candidate, STAGE_LABELS } from '../types'

function toRow(c: Candidate) {
  return {
    'Candidate Code': c.candidate_code,
    'Full Name': c.full_name,
    Phone: c.phone,
    Email: c.email ?? '',
    'Position Applied': c.position_applied,
    'Experience (yrs)': c.experience_years,
    Stage: STAGE_LABELS[c.stage],
    'Resume Received': c.resume_received ? 'Yes' : 'No',
    'Registration Complete': c.registration_complete ? 'Yes' : 'No',
    'HR Feedback': c.hr_feedback ?? '',
    'HR Started': c.hr_started_at ?? '',
    'HR Completed': c.hr_completed_at ?? '',
    'Cabin Number': c.cabin_number ?? '',
    'Cabin Started': c.cabin_started_at ?? '',
    'Cabin Completed': c.cabin_completed_at ?? '',
    'Interview Rating': c.interview_rating ?? '',
    'Interview Recommendation': c.interview_recommendation ?? '',
    'Interview Comments': c.interview_comments ?? '',
    'LOI Issued': c.loi_issued ? 'Yes' : 'No',
    'Aadhaar Received': c.aadhaar_received ? 'Yes' : 'No',
    'Exit Time': c.exit_time ?? '',
    'Rejected At Stage': c.rejected_at_stage ? STAGE_LABELS[c.rejected_at_stage] : '',
    'Rejection Reason': c.rejection_reason ?? '',
    'Registered At': c.registered_at,
    'Completed At': c.completed_at ?? '',
  }
}

function filename(ext: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  return `candidates-export-${ts}.${ext}`
}

export function exportToXlsx(candidates: Candidate[]) {
  const rows = candidates.map(toRow)
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Candidates')
  XLSX.writeFile(wb, filename('xlsx'))
}

export function exportToCsv(candidates: Candidate[]) {
  const rows = candidates.map(toRow)
  const ws = XLSX.utils.json_to_sheet(rows)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename('csv')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
