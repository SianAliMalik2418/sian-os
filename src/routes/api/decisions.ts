import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, json, readJson } from '@/lib/http'
import { decisionSchema } from '@/lib/schemas'
import type { Decision } from '@/lib/types'

export const Route = createFileRoute('/api/decisions')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const limitParam = new URL(request.url).searchParams.get('limit')
        const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 1, 1), 200) : 50
        const result = await db().prepare('SELECT * FROM decisions ORDER BY date DESC, id DESC LIMIT ?').bind(limit).all<Decision>()
        return json({ ok: true, data: result.results })
      }),
      POST: async ({ request }) => handleApi(async () => {
        const input = decisionSchema.parse(await readJson(request))
        const result = await db().prepare(`
          INSERT INTO decisions (date, decision)
          VALUES (?, ?)
          RETURNING *
        `).bind(input.date, input.decision).first<Decision>()
        await recordApiWrite('create', 'decision', result?.id, input)
        return json({ ok: true, data: result }, { status: 201 })
      }),
    },
  },
})
