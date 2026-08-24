import { describe, expect, it } from 'vitest'
import { groupProgressPhotosByDate } from './progress-photos'
import type { ProgressPhoto } from './types'

describe('groupProgressPhotosByDate', () => {
  it('sections photos by date while preserving newest-first photo order', () => {
    const photos: ProgressPhoto[] = [
      photo(3, '2026-08-24', 'Side'),
      photo(2, '2026-08-24', 'Front'),
      photo(1, '2026-08-20', 'Start'),
    ]

    expect(groupProgressPhotosByDate(photos)).toEqual([
      { date: '2026-08-24', photos: [photos[0], photos[1]] },
      { date: '2026-08-20', photos: [photos[2]] },
    ])
  })
})

function photo(id: number, date: string, label: string): ProgressPhoto {
  return {
    id,
    date,
    label,
    notes: null,
    created_at: `${date} 12:00:00`,
  }
}
