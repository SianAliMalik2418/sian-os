import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { db, recordApiWrite } from '@/lib/db'
import { handleApi, HttpError, json, readJson } from '@/lib/http'
import { dateSchema } from '@/lib/schemas'

const keySchema = z.enum(['last_weekly_report_date', 'last_nightly_review_note'])
const agentStateSchema = z.object({
  key: keySchema,
  value: z.string().max(2000).nullable(),
}).strict().superRefine((data, ctx) => {
  if (data.key === 'last_weekly_report_date' && data.value !== null && !dateSchema.safeParse(data.value).success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'value must be YYYY-MM-DD for last_weekly_report_date' })
  }
})

type AgentState = {
  key: string
  value: string | null
  updated_at: string
}

export const Route = createFileRoute('/api/agent/state')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const key = keySchema.parse(new URL(request.url).searchParams.get('key') ?? 'last_weekly_report_date')
        const result = await db().prepare('SELECT key, value, updated_at FROM agent_state WHERE key = ?').bind(key).first<AgentState>()
        return json({ ok: true, data: result ?? { key, value: null, updated_at: null } })
      }),
      PUT: async ({ request }) => handleApi(async () => {
        const input = agentStateSchema.parse(await readJson(request))
        const result = await db().prepare(`
          INSERT INTO agent_state (key, value, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
          RETURNING key, value, updated_at
        `).bind(input.key, input.value).first<AgentState>()
        if (!result) throw new HttpError(500, 'STATE_WRITE_FAILED', 'Agent state was not saved')
        await recordApiWrite('upsert', 'agent_state', input.key, input)
        return json({ ok: true, data: result })
      }),
    },
  },
})
