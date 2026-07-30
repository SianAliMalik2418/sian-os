import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, HttpError, json } from '@/lib/http'

const maxPhotoBytes = 15 * 1024 * 1024

export const Route = createFileRoute('/api/progress-photos')({
  server: {
    handlers: {
      GET: async () => handleApi(async () => {
        const result = await db().prepare('SELECT id, date, label, notes, created_at FROM progress_photos ORDER BY date DESC, id DESC LIMIT 500').all()
        return json({ ok: true, data: result.results })
      }),
      POST: async ({ request }) => handleApi(async () => {
        const form = await request.formData()
        const file = form.get('photo')
        const date = String(form.get('date') || '')
        const label = String(form.get('label') || '').trim()
        const notes = String(form.get('notes') || '').trim()
        if (!(file instanceof File)) throw new HttpError(400, 'PHOTO_REQUIRED', 'A photo file is required')
        if (!file.type.startsWith('image/')) throw new HttpError(400, 'INVALID_PHOTO', 'Only image files are accepted')
        if (file.size > maxPhotoBytes) throw new HttpError(413, 'PHOTO_TOO_LARGE', 'Photos must be 15 MB or smaller')
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, 'INVALID_DATE', 'Use YYYY-MM-DD')
        const extension = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'image'
        const key = `progress/${date}/${crypto.randomUUID()}.${extension}`
        await env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { originalName: file.name } })
        try {
          const result = await db().prepare('INSERT INTO progress_photos (date, r2_key, label, notes) VALUES (?, ?, ?, ?)')
            .bind(date, key, label || null, notes || null).run()
          await recordApiWrite('create', 'progress_photo', result.meta.last_row_id, { date, label, key })
          return json({ ok: true, data: { id: result.meta.last_row_id } }, { status: 201 })
        } catch (error) {
          await env.FILES.delete(key)
          throw error
        }
      }),
    },
  },
})
