interface FlakeRateBadgeProps {
  flakeRate: number
  resolvedCount: number
}

export default function FlakeRateBadge({ flakeRate, resolvedCount }: FlakeRateBadgeProps) {
  if (resolvedCount === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        New Member
      </span>
    )
  }

  const color =
    flakeRate === 0
      ? 'bg-green-100 text-green-800'
      : flakeRate < 25
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800'

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${color}`}
    >
      Flake Rate: {flakeRate.toFixed(1)}%
    </span>
  )
}
