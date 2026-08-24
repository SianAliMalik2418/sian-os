import type { ProgressPhoto } from './types'

export interface ProgressPhotoGroup {
  date: string
  photos: ProgressPhoto[]
}

export function groupProgressPhotosByDate(photos: ProgressPhoto[]): ProgressPhotoGroup[] {
  const groups = new Map<string, ProgressPhotoGroup>()

  for (const photo of photos) {
    const group = groups.get(photo.date)
    if (group) {
      group.photos.push(photo)
      continue
    }
    groups.set(photo.date, { date: photo.date, photos: [photo] })
  }

  return [...groups.values()]
}
