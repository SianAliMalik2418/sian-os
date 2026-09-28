import { useId } from 'react'
import { cn } from '@/lib/utils'

const STARS = [[24, 22, 1.4], [70, 48, 1], [118, 18, 1.6], [160, 60, 1], [206, 30, 1.2], [300, 20, 1.5], [340, 56, 1], [250, 70, 0.9], [44, 96, 1], [330, 104, 1.2], [96, 128, 0.8], [186, 104, 0.9]] as const
const TRAIL = 'M30 268 Q80 262 115 236 T178 196 Q200 180 218 180 T264 142'

export function SunMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs><linearGradient id="sunmark-sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd23f" /><stop offset="1" stopColor="#ff6b2c" /></linearGradient></defs>
      <rect width="40" height="40" rx="12" fill="#1c1836" />
      <circle cx="24" cy="21" r="8" fill="url(#sunmark-sun)" />
      <path d="M4 34 L15 20 L21 27 L25 23 L36 34 Z" fill="#ff6b2c" />
      <path d="M4 34 L15 20 L18 24 L11 34 Z" fill="#ff9447" opacity=".7" />
    </svg>
  )
}

/** Dashboard hero: a dusk sky with a rising sun, and a climber walking the trail up to `progress` (0–1) of the hill. Pure CSS, so it renders in place before hydration. */
export function SunriseScene({ progress, className }: { progress: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  const target = Math.min(Math.max(progress, 0), 1)

  return (
    <svg viewBox="0 0 370 300" preserveAspectRatio="xMidYMid slice" className={cn('size-full', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#151029" />
          <stop offset=".42" stopColor="#2e1e4f" />
          <stop offset=".72" stopColor="#7a3558" />
          <stop offset="1" stopColor="#ff8a50" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}><stop offset="0" stopColor="#ff9447" stopOpacity=".55" /><stop offset="1" stopColor="#ff9447" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd23f" /><stop offset="1" stopColor="#ff6b2c" /></linearGradient>
        <linearGradient id={`${id}-mountain`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff7a3d" /><stop offset=".55" stopColor="#c2410c" /><stop offset="1" stopColor="#4a1d3a" /></linearGradient>
        <linearGradient id={`${id}-hills`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b2c6f" /><stop offset="1" stopColor="#2a1a45" /></linearGradient>
      </defs>
      <rect width="370" height="300" fill={`url(#${id}-sky)`} />
      {STARS.map(([x, y, r], index) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#fff5e8" className="anim-twinkle" style={{ animationDelay: `${index * 0.37}s` }} />)}
      <g className="sun-up">
        <circle cx="262" cy="150" r="96" fill={`url(#${id}-glow)`} />
        <g className="anim-spin-slow" style={{ transformOrigin: '262px 150px' }} fill="#ffb065" opacity=".75">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => <rect key={angle} x="259" y="78" width="6" height="18" rx="3" transform={`rotate(${angle} 262 150)`} />)}
        </g>
        <circle cx="262" cy="150" r="42" fill={`url(#${id}-sun)`} />
      </g>
      <g className="anim-drift" fill="#6b3f7a" opacity=".55"><ellipse cx="40" cy="116" rx="30" ry="10" /><ellipse cx="58" cy="108" rx="18" ry="12" /></g>
      <g className="anim-drift" style={{ animationDuration: '30s', animationDelay: '-12s' }} fill="#6b3f7a" opacity=".4"><ellipse cx="20" cy="70" rx="22" ry="7" /><ellipse cx="34" cy="64" rx="13" ry="9" /></g>
      <path d="M0 236 Q70 180 150 206 T370 176 V300 H0z" fill={`url(#${id}-hills)`} />
      <path d="M0 300 L0 274 Q60 256 110 236 L180 186 Q200 172 214 180 L250 146 Q262 136 272 146 L370 226 V300z" fill={`url(#${id}-mountain)`} />
      <path d="M250 146 Q262 136 272 146 L300 170 L262 160 Z" fill="#fff5e8" opacity=".18" />
      <path d={TRAIL} fill="none" stroke="#fff5e8" strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" opacity=".55" />
      <path d={TRAIL} pathLength={1} fill="none" stroke="#fff5e8" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - target} className="hill-walk" />
      <line x1="264" y1="142" x2="264" y2="112" stroke="#fff5e8" strokeWidth="3" strokeLinecap="round" />
      <path d="M265 113 L290 120 L265 128z" fill="#ffd23f" className="anim-wave" style={{ transformOrigin: '265px 113px' }} />
      <g className="hill-climb" style={{ offsetPath: `path('${TRAIL}')`, offsetDistance: `${target * 100}%`, offsetRotate: '0deg' }}>
        <circle r="10" fill="#fff5e8" opacity=".5" className="anim-pulse-ring" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
        <circle r="10" fill="#fff5e8" />
        <circle r="5.5" fill="#1d1330" />
      </g>
      <path d="M0 300 V282 Q90 268 185 288 T370 278 V300z" fill="#120f24" />
    </svg>
  )
}

/** Small scene used as a page-header illustration. Each page gets its own subject. */
export function HeaderIllustration({ kind, className }: { kind: 'reports' | 'recipes' | 'profile' | 'lyfta' | 'gallery'; className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={cn('overflow-visible', className)} aria-hidden="true">
      <circle cx="112" cy="46" r="30" fill="#ff9447" opacity=".16" />
      <circle cx="112" cy="46" r="18" fill="#ff6b2c" className="sun-up" />
      {kind === 'reports' && <g>
        {[[20, 60], [44, 44], [68, 70], [92, 30]].map(([x, h], index) => <rect key={x} x={x} y={110 - h} width="18" height={h} rx="6" fill={['#a78bfa', '#2dd4bf', '#ffd23f', '#ff6b2c'][index]} className="grow-y" style={{ '--d': index } as React.CSSProperties} />)}
        <path d="M18 72 L50 58 L76 76 L104 40 L132 30" fill="none" stroke="#fff5e8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="draw" style={{ '--len': 160 } as React.CSSProperties} />
        <circle cx="132" cy="30" r="5" fill="#fff5e8" className="pop" style={{ '--d': 12 } as React.CSSProperties} />
      </g>}
      {kind === 'recipes' && <g>
        <g className="anim-steam" fill="none" stroke="#fff5e8" strokeWidth="3" strokeLinecap="round" opacity=".8"><path d="M52 40 q-6 -8 0 -16 q6 -8 0 -16" /></g>
        <g className="anim-steam" style={{ animationDelay: '.8s' }} fill="none" stroke="#fff5e8" strokeWidth="3" strokeLinecap="round" opacity=".8"><path d="M72 40 q-6 -8 0 -16 q6 -8 0 -16" /></g>
        <g className="anim-steam" style={{ animationDelay: '1.6s' }} fill="none" stroke="#fff5e8" strokeWidth="3" strokeLinecap="round" opacity=".8"><path d="M92 40 q-6 -8 0 -16 q6 -8 0 -16" /></g>
        <rect x="26" y="52" width="92" height="54" rx="18" fill="#ff6b2c" />
        <rect x="18" y="46" width="108" height="14" rx="7" fill="#ff9447" />
        <rect x="8" y="64" width="22" height="10" rx="5" fill="#c2410c" />
        <rect x="114" y="64" width="22" height="10" rx="5" fill="#c2410c" />
        <circle cx="54" cy="80" r="5" fill="#ffd23f" /><circle cx="72" cy="86" r="5" fill="#2dd4bf" /><circle cx="90" cy="78" r="5" fill="#fff5e8" />
      </g>}
      {kind === 'profile' && <g>
        <path d="M4 112 L56 44 L80 72 L96 56 L156 112 Z" fill="#a78bfa" opacity=".9" />
        <path d="M56 44 L68 60 L56 58 L46 58 Z" fill="#fff5e8" opacity=".7" />
        <line x1="56" y1="44" x2="56" y2="14" stroke="#fff5e8" strokeWidth="3" strokeLinecap="round" />
        <path d="M57 15 L82 22 L57 30z" fill="#ffd23f" className="anim-wave" style={{ transformOrigin: '57px 15px' }} />
        <circle cx="120" cy="96" r="12" fill="#2dd4bf" className="anim-bob" /><path d="M114 96 l4 4 l8 -8" fill="none" stroke="#120f24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="anim-bob" />
      </g>}
      {kind === 'lyfta' && <g className="anim-sway" style={{ transformOrigin: '72px 76px' }}>
        <rect x="14" y="56" width="16" height="40" rx="5" fill="#ff6b2c" /><rect x="30" y="50" width="12" height="52" rx="5" fill="#ff9447" />
        <rect x="42" y="72" width="60" height="9" rx="4" fill="#fff5e8" />
        <rect x="102" y="50" width="12" height="52" rx="5" fill="#ff9447" /><rect x="114" y="56" width="16" height="40" rx="5" fill="#ff6b2c" />
      </g>}
      {kind === 'gallery' && <g>
        <rect x="22" y="40" width="64" height="76" rx="10" fill="#a78bfa" transform="rotate(-8 54 78)" />
        <rect x="58" y="34" width="64" height="76" rx="10" fill="#fff5e8" transform="rotate(6 90 72)" />
        <path d="M70 92 L84 72 L96 86 L104 78 L116 94 Z" fill="#ff6b2c" transform="rotate(6 90 72)" />
        <circle cx="104" cy="58" r="6" fill="#ffd23f" transform="rotate(6 90 72)" className="anim-twinkle" />
      </g>}
    </svg>
  )
}

type DoodleKind = 'scale' | 'steps' | 'flame' | 'moon' | 'check' | 'protein' | 'plate'

/** Tile doodles, each with a small looping idle animation. */
export function Doodle({ kind, className }: { kind: DoodleKind; className?: string }) {
  return (
    <svg viewBox="0 0 70 70" className={cn('size-16', className)} aria-hidden="true">
      {kind === 'scale' && <g className="anim-bob"><rect x="12" y="22" width="46" height="36" rx="12" fill="#ff8a50" /><circle cx="35" cy="38" r="10" fill="#fff5e8" /><path d="M35 38 L41 33" stroke="#7a2d0e" strokeWidth="3" strokeLinecap="round" /></g>}
      {kind === 'steps' && <g className="anim-walk"><ellipse cx="26" cy="34" rx="9" ry="14" fill="#14b8a6" /><ellipse cx="46" cy="26" rx="9" ry="14" fill="#2dd4bf" /><circle cx="26" cy="54" r="5" fill="#14b8a6" /><circle cx="46" cy="46" r="5" fill="#2dd4bf" /></g>}
      {kind === 'flame' && <g className="anim-flicker"><path fill="#ff9f1c" d="M37 6c2 9 18 16 18 34a20 20 0 0 1-40 1c0-8 4-14 9-18 0 6 3 10 7 11-1-12 1-20 6-28z" /><path fill="#ffe08a" d="M35 38c2 5 9 8 9 15a9 9 0 0 1-18 1c0-4 2-7 5-9 0 3 2 4 4 5-1-5 0-8 0-12z" /></g>}
      {kind === 'moon' && <g className="anim-sway" style={{ transformOrigin: '35px 35px' }}><path d="M52 40A20 20 0 1 1 30 18a15 15 0 0 0 22 22z" fill="#a78bfa" /><circle cx="52" cy="16" r="3" fill="#c4b5fd" className="anim-twinkle" /><circle cx="60" cy="28" r="2" fill="#c4b5fd" className="anim-twinkle" style={{ animationDelay: '.8s' }} /></g>}
      {kind === 'check' && <g className="anim-bob"><circle cx="35" cy="35" r="22" fill="#2dd4bf" /><path d="M25 35 l7 7 l14 -14" fill="none" stroke="#120f24" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></g>}
      {kind === 'protein' && <g className="anim-bob"><path d="M20 30 a15 15 0 0 1 30 0 v4 a15 15 0 0 1 -30 0z" fill="#ff7a8a" /><rect x="30" y="44" width="10" height="16" rx="5" fill="#fff5e8" /><circle cx="35" cy="24" r="4" fill="#fff5e8" opacity=".6" /></g>}
      {kind === 'plate' && <g className="anim-bob"><circle cx="35" cy="38" r="22" fill="#fff5e8" opacity=".9" /><circle cx="35" cy="38" r="14" fill="#ff9447" /><circle cx="30" cy="34" r="4" fill="#2dd4bf" /><circle cx="40" cy="42" r="3" fill="#ffd23f" /></g>}
    </svg>
  )
}

/** Week strip day marker: a risen sun for completed days, a dawn for today, a faint dot otherwise. */
export function DaySun({ state }: { state: 'done' | 'today' | 'idle' }) {
  if (state === 'today') {
    return <svg viewBox="0 0 30 30" className="size-8" aria-hidden="true"><path d="M4 22h22" stroke="#ff6b2c" strokeWidth="2.5" strokeLinecap="round" /><path d="M8 22a7 7 0 0 1 14 0" fill="none" stroke="#ff9447" strokeWidth="2.5" strokeDasharray="3 3" className="anim-spin-slow" style={{ transformOrigin: '15px 22px', animationDuration: '8s' }} /></svg>
  }
  if (state === 'done') {
    return <svg viewBox="0 0 30 30" className="size-8" aria-hidden="true"><g className="anim-spin-slow" style={{ transformOrigin: '15px 15px', animationDuration: '12s' }} stroke="#ffb065" strokeWidth="2.5" strokeLinecap="round"><path d="M15 2v4M15 24v4M2 15h4M24 15h4M6 6l3 3M21 21l3 3M6 24l3-3M21 9l3-3" /></g><circle cx="15" cy="15" r="7" fill="#ff8a3d" /></svg>
  }
  return <svg viewBox="0 0 30 30" className="size-8" aria-hidden="true"><circle cx="15" cy="15" r="6" fill="none" stroke="#a9a3c7" strokeOpacity=".35" strokeWidth="2" /></svg>
}
