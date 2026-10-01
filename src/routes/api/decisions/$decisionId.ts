import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, HttpError, json } from '@/lib/http'

export const Route = createFileRoute('/api/decisions/$decisionId')({
  server: {
    handlers: {
      DELETE: async ({ params }) => handleApi(async () => {
        const id = Number(params.decisionId)
        if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid decision id')
        const existing = await db().prepare('SELECT id FROM decisions WHERE id = ?').bind(id).first<{ id: number }>()
        if (!existing) throw new HttpError(404, 'NOT_FOUND', 'Decision not found')
        await db().prepare('DELETE FROM decisions WHERE id = ?').bind(id).run()
        await recordApiWrite('delete', 'decision', id)
        return json({ ok: true, data: { id } })
      }),
    },
  },
})
