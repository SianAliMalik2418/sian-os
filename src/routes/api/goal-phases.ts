import { createFileRoute } from '@tanstack/react-router'
import { db, recordApiWrite, startGoalPhase } from '@/lib/db'
import { handleApi, json, readJson } from '@/lib/http'
import { goalPhaseSchema } from '@/lib/schemas'
import type { GoalPhase } from '@/lib/types'

export const Route = createFileRoute('/api/goal-phases')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const limitParam = new URL(request.url).searchParams.get('limit')
        const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 1, 1), 200) : 50
        const result = await db().prepare('SELECT * FROM goal_phases ORDER BY started_at DESC, id DESC LIMIT ?').bind(limit).all<GoalPhase>()
        return json({ ok: true, data: result.results })
      }),
      POST: async ({ request }) => handleApi(async () => {
        const input = goalPhaseSchema.parse(await readJson(request))
        const result = await startGoalPhase(input)
        await recordApiWrite('create', 'goal_phase', result?.id, input)
        return json({ ok: true, data: result }, { status: 201 })
      }),
    },
  },
})
