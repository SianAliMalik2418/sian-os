import { useEffect, useRef, useState } from 'react'
import { CountUp, Unit } from '@/components/sunrise/primitives'

/** Click-to-edit numeric value for a ToneTile, used by the dashboard weight widget and profile goal tiles. */
export function EditableNumber({ value, unit, min = 0, max, step = 1, decimals = 0, placeholder = 'Tap to log', ariaLabel, onSave }: {
  value: number | null
  unit: string
  min?: number
  max: number
  step?: number
  decimals?: number
  placeholder?: string
  ariaLabel: string
  onSave: (value: number) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value != null ? String(value) : '')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraft(value != null ? String(value) : '')
  }, [value, editing])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function commit() {
    const parsed = Number(draft)
    if (draft.trim() === '' || !Number.isFinite(parsed) || parsed < min) {
      setEditing(false)
      setDraft(value != null ? String(value) : '')
      return
    }
    setSaving(true)
    try {
      await onSave(decimals > 0 ? Number(parsed.toFixed(decimals)) : Math.round(parsed))
      setEditing(false)
    } catch {
      // keep the field open so the value isn't silently lost
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={min}
        max={max}
        step={step}
        inputMode="decimal"
        value={draft}
        disabled={saving}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            void commit()
          }
          if (event.key === 'Escape') {
            setEditing(false)
            setDraft(value != null ? String(value) : '')
          }
        }}
        aria-label={ariaLabel}
        className="w-full min-w-0 bg-transparent text-[1.9rem] leading-none font-extrabold tracking-tight text-cream tabular-nums outline-none [appearance:textfield]"
      />
    )
  }

  return (
    <button type="button" onClick={() => setEditing(true)} className="text-left text-[1.9rem] leading-none font-extrabold tracking-tight text-cream" aria-label={ariaLabel}>
      {value === null ? <span className="text-lg font-bold text-muted-foreground">{placeholder}</span> : <><CountUp value={value} decimals={decimals} /><Unit>{unit}</Unit></>}
    </button>
  )
}
