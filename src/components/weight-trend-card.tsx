import { motion } from 'motion/react'

/** Self-drawing weight trend line. Hides itself when fewer than two points exist — never fabricates data. */
export function WeightTrendCard({ points }: { points: Array<{ date: string; weight_kg: number }> }) {
  if (points.length < 2) return null

  const ordered = [...points].reverse()
  const width = 280
  const height = 64
  const values = ordered.map((point) => point.weight_kg)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = width / (ordered.length - 1)
  const coords = ordered.map((point, index) => ({
    x: index * stepX,
    y: height - ((point.weight_kg - min) / range) * height,
  }))
  const path = coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')
  const latest = ordered.at(-1)?.weight_kg
  const first = ordered[0]?.weight_kg
  const delta = latest !== undefined && first !== undefined ? latest - first : null

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Weight trend</span>
        {delta !== null && <b className={delta <= 0 ? 'text-lime-400' : 'text-orange-400'}>{delta > 0 ? '+' : ''}{delta.toFixed(1)} kg</b>}
      </div>
      <svg viewBox={`0 -8 ${width} ${height + 16}`} className="mt-2 block h-16 w-full overflow-visible">
        <motion.path d={path} fill="none" stroke="url(#weight-trend-gradient)" strokeWidth={2.5} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }} />
        <defs>
          <linearGradient id="weight-trend-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#67e8f9" />
            <stop offset="1" stopColor="#a3e635" />
          </linearGradient>
        </defs>
        {coords.map((point, index) => (
          <motion.circle key={ordered[index].date} cx={point.x} cy={point.y} r={index === coords.length - 1 ? 4 : 2.5} fill={index === coords.length - 1 ? '#a3e635' : '#67e8f9'} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * 0.08 + 0.6, type: 'spring', stiffness: 300, damping: 15 }} />
        ))}
      </svg>
    </div>
  )
}
