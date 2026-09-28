export function AuroraBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
      <span className="aurora-blob" style={{ width: 340, height: 340, top: -120, left: -80, background: '#22d3ee', animation: 'aurora-drift-a 12s ease-in-out infinite alternate' }} />
      <span className="aurora-blob" style={{ width: 340, height: 340, top: 80, right: -140, background: '#8b5cf6', animation: 'aurora-drift-b 14s ease-in-out infinite alternate' }} />
      <span className="aurora-blob" style={{ width: 340, height: 340, bottom: -160, left: 20, opacity: 0.25, background: '#a3e635', animation: 'aurora-drift-c 16s ease-in-out infinite alternate-reverse' }} />
    </div>
  )
}
