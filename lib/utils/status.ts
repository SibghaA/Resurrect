const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-800',
  Paused: 'bg-amber-100 text-amber-800',
  'Handed Off': 'bg-blue-100 text-blue-800',
  Complete: 'bg-gray-100 text-gray-800',
}

export function statusBadgeColor(status: string): string {
  return STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'
}
