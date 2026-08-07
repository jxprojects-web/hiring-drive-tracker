import { CandidateStage, STAGE_COLOR_CLASS, STAGE_LABELS } from '../types'
import clsx from 'clsx'

export function StageBadge({ stage }: { stage: CandidateStage }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white',
        STAGE_COLOR_CLASS[stage]
      )}
    >
      {STAGE_LABELS[stage]}
    </span>
  )
}
