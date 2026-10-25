import { arc as d3arc, pie as d3pie, type PieArcDatum } from 'd3-shape'
import type { ReactNode } from 'react'

export interface DonutSlice {
  key: string
  label: string
  value: number
  color: string
}

/** Self-contained SVG donut (via d3-shape), not wired into dither-kit's polar chart
 * infrastructure — that chart family ships canvases for area/bar only, so a pie/donut
 * canvas doesn't exist yet. Simple and isolated keeps this low-risk to add. */
export function MoneyDivisionDonut({ slices, size = 160, thickness = 24, centerLabel }: {
  slices: DonutSlice[]
  size?: number
  thickness?: number
  centerLabel?: ReactNode
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const radius = size / 2
  const innerRadius = Math.max(0, radius - thickness)
  const pieGen = d3pie<DonutSlice>().value((d) => d.value).sort(null).padAngle(0.02)
  const arcGen = d3arc<PieArcDatum<DonutSlice>>().innerRadius(innerRadius).outerRadius(radius).cornerRadius(3)
  const arcs = total > 0 ? pieGen(slices) : []

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Money division">
        <g transform={`translate(${radius}, ${radius})`}>
          {arcs.length
            ? arcs.map((a) => <path key={a.data.key} d={arcGen(a) ?? undefined} fill={a.data.color} />)
            : <circle r={innerRadius + thickness / 2} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={thickness} />}
        </g>
      </svg>
      {centerLabel && <div className="absolute inset-0 grid place-items-center text-center">{centerLabel}</div>}
    </div>
  )
}

export function DonutLegend({ slices, formatter }: { slices: DonutSlice[]; formatter: (value: number) => string }) {
  return (
    <ul className="grid gap-1.5">
      {slices.map((slice) => (
        <li key={slice.key} className="flex items-center justify-between gap-3 text-sm font-semibold">
          <span className="flex items-center gap-2 text-muted-foreground"><span className="size-2.5 rounded-full" style={{ background: slice.color }} />{slice.label}</span>
          <span className="font-extrabold text-cream tabular-nums">{formatter(slice.value)}</span>
        </li>
      ))}
    </ul>
  )
}
