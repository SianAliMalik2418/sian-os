import { createFileRoute } from '@tanstack/react-router'
import { dashboardSummary } from '@/lib/db'
import { handleApi, json } from '@/lib/http'

export const Route = createFileRoute('/api/dashboard')({
  server: {
    handlers: {
      GET: async () => handleApi(async () => {
        return json({ ok: true, data: await dashboardSummary() }, { headers: { 'Cache-Control': 'no-store' } })
      }),
    },
  },
})
