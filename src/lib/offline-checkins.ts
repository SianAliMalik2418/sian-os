import type { CheckinInput } from './schemas'

const queueKey = 'sian-os:queued-checkins'

export interface QueuedCheckin {
  id: string
  payload: CheckinInput
  queuedAt: string
  attempts: number
  lastError?: string
}

export interface SyncCheckinsResult {
  synced: number
  pending: number
  failed?: QueuedCheckin
}

export function readQueuedCheckins(): QueuedCheckin[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(queueKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as QueuedCheckin[]
    return Array.isArray(parsed) ? parsed.filter((item) => item?.payload?.date) : []
  } catch {
    return []
  }
}

export function queueCheckin(payload: CheckinInput) {
  const queued = readQueuedCheckins()
  const next: QueuedCheckin = {
    id: makeQueueId(),
    payload,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  }

  writeQueuedCheckins([...queued.filter((item) => item.payload.date !== payload.date), next])
  return next
}

function makeQueueId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export async function syncQueuedCheckins(): Promise<SyncCheckinsResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, pending: readQueuedCheckins().length }
  }

  let synced = 0
  let queued = readQueuedCheckins()

  for (const item of queued) {
    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      })
      const result = await response.json().catch(() => null) as { error?: { message?: string } } | null

      if (!response.ok) {
        throw new Error(result?.error?.message || 'Could not sync check-in')
      }

      synced += 1
      queued = queued.filter((queuedItem) => queuedItem.id !== item.id)
      writeQueuedCheckins(queued)
    } catch (caught) {
      const failed = {
        ...item,
        attempts: item.attempts + 1,
        lastError: caught instanceof Error ? caught.message : 'Could not sync check-in',
      }
      writeQueuedCheckins(queued.map((queuedItem) => queuedItem.id === item.id ? failed : queuedItem))
      return { synced, pending: queued.length, failed }
    }
  }

  return { synced, pending: 0 }
}

function writeQueuedCheckins(queued: QueuedCheckin[]) {
  if (typeof window === 'undefined') return

  if (queued.length === 0) {
    window.localStorage.removeItem(queueKey)
    return
  }

  window.localStorage.setItem(queueKey, JSON.stringify(queued))
}
