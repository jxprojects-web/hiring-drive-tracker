import clsx from 'clsx'

type AlertKind = 'waiting' | 'interview' | 'incomplete' | 'completed' | 'ok'

const STYLES: Record<AlertKind, string> = {
  waiting: 'bg-red-100 text-red-800 border border-red-300',
  interview: 'bg-orange-100 text-orange-800 border border-orange-300',
  incomplete: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  completed: 'bg-green-100 text-green-800 border border-green-300',
  ok: 'bg-gray-100 text-gray-600 border border-gray-200',
}

export function AlertBadge({ kind, label }: { kind: AlertKind; label: string }) {
  return (
    <span className={clsx('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', STYLES[kind])}>
      {label}
    </span>
  )
}
