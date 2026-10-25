import { createFileRoute } from '@tanstack/react-router'
import { financeSummary } from '@/lib/finance'
import { handleApi, json } from '@/lib/http'
import { dateSchema } from '@/lib/schemas'

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10)
}

export const Route = createFileRoute('/api/finance/summary')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const url = new URL(request.url)
        const now = new Date()
        const from = dateSchema.parse(url.searchParams.get('from') ?? monthStart(now))
        const to = dateSchema.parse(url.searchParams.get('to') ?? now.toISOString().slice(0, 10))
        return json({ ok: true, data: await financeSummary({ from, to }) })
      }),
    },
  },
})
