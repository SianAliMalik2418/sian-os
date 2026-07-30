import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, HttpError, json } from '@/lib/http'

function photoId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'INVALID_ID', 'Photo id must be a positive integer')
  return id
}

export const Route = createFileRoute('/api/progress-photos/$photoId')({
  server: {
    handlers: {
      GET: async ({ params }) => handleApi(async () => {
        const photo = await db().prepare('SELECT r2_key FROM progress_photos WHERE id = ?').bind(photoId(params.photoId)).first<{ r2_key: string }>()
        if (!photo) throw new HttpError(404, 'NOT_FOUND', 'Photo not found')
        const object = await env.FILES.get(photo.r2_key)
        if (!object) throw new HttpError(404, 'OBJECT_NOT_FOUND', 'Photo object not found')
        const headers = new Headers({ 'Cache-Control': 'private, max-age=3600', ETag: object.httpEtag })
        object.writeHttpMetadata(headers)
        return new Response(object.body, { headers })
      }),
      DELETE: async ({ params }) => handleApi(async () => {
        const id = photoId(params.photoId)
        const photo = await db().prepare('SELECT r2_key FROM progress_photos WHERE id = ?').bind(id).first<{ r2_key: string }>()
        if (!photo) throw new HttpError(404, 'NOT_FOUND', 'Photo not found')
        await env.FILES.delete(photo.r2_key)
        await db().prepare('DELETE FROM progress_photos WHERE id = ?').bind(id).run()
        await recordApiWrite('delete', 'progress_photo', id)
        return json({ ok: true })
      }),
    },
  },
})
