export type AppRole =
  | 'admin'
  | 'reception'
  | 'hr'
  | 'cabin_1'
  | 'cabin_2'
  | 'cabin_3'
  | 'cabin_4'
  | 'loi_desk'
  | 'viewer'

export type CandidateStage =
  | 'reception'
  | 'hr_screening'
  | 'cabin_1'
  | 'cabin_2'
  | 'cabin_3'
  | 'cabin_4'
  | 'loi'
  | 'completed'
  | 'rejected'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: AppRole
  created_at: string
}

export interface Candidate {
  id: string
  candidate_code: string
  full_name: string
  phone: string
  email: string | null
  position_applied: string
  experience_years: number
  is_experienced: boolean

  resume_received: boolean
  registration_complete: boolean

  stage: CandidateStage

  hr_feedback: string | null
  hr_started_at: string | null
  hr_completed_at: string | null

  cabin_number: number | null
  cabin_started_at: string | null
  cabin_completed_at: string | null
  interview_rating: number | null
  interview_recommendation: 'select' | 'hold' | 'reject' | null
  interview_comments: string | null

  loi_issued: boolean
  aadhaar_received: boolean
  exit_time: string | null

  rejected_at_stage: CandidateStage | null
  rejection_reason: string | null

  registered_at: string
  completed_at: string | null

  created_by: string | null
  updated_at: string
}

export interface ActivityLogEntry {
  id: number
  candidate_id: string
  from_stage: CandidateStage | null
  to_stage: CandidateStage
  changed_by: string | null
  changed_by_email: string | null
  changed_at: string
  note: string | null
}

export interface Settings {
  id: number
  hr_wait_threshold_minutes: number
  interview_duration_threshold_minutes: number
  event_name: string
  updated_at: string
  updated_by: string | null
}

export const STAGE_LABELS: Record<CandidateStage, string> = {
  reception: 'Reception',
  hr_screening: 'HR Screening',
  cabin_1: 'Cabin 1',
  cabin_2: 'Cabin 2',
  cabin_3: 'Cabin 3',
  cabin_4: 'Cabin 4',
  loi: 'LOI / Offer',
  completed: 'Completed',
  rejected: 'Rejected',
}

export const STAGE_COLOR_CLASS: Record<CandidateStage, string> = {
  reception: 'bg-stage-reception',
  hr_screening: 'bg-stage-hr',
  cabin_1: 'bg-stage-cabin1',
  cabin_2: 'bg-stage-cabin2',
  cabin_3: 'bg-stage-cabin3',
  cabin_4: 'bg-stage-cabin4',
  loi: 'bg-stage-loi',
  completed: 'bg-stage-completed',
  rejected: 'bg-stage-rejected',
}

export const STAGE_TEXT_CLASS: Record<CandidateStage, string> = {
  reception: 'text-stage-reception',
  hr_screening: 'text-stage-hr',
  cabin_1: 'text-stage-cabin1',
  cabin_2: 'text-stage-cabin2',
  cabin_3: 'text-stage-cabin3',
  cabin_4: 'text-stage-cabin4',
  loi: 'text-stage-loi',
  completed: 'text-stage-completed',
  rejected: 'text-stage-rejected',
}

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Admin',
  reception: 'Reception',
  hr: 'HR Screening',
  cabin_1: 'Cabin 1',
  cabin_2: 'Cabin 2',
  cabin_3: 'Cabin 3',
  cabin_4: 'Cabin 4 (Experienced only)',
  loi_desk: 'LOI Desk',
  viewer: 'Volunteer (read-only)',
}

// Which stage a given role "owns" for action screens.
export const ROLE_OWNED_STAGE: Partial<Record<AppRole, CandidateStage>> = {
  reception: 'reception',
  hr: 'hr_screening',
  cabin_1: 'cabin_1',
  cabin_2: 'cabin_2',
  cabin_3: 'cabin_3',
  cabin_4: 'cabin_4',
  loi_desk: 'loi',
}
