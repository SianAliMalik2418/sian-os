import { createFileRoute } from '@tanstack/react-router'
import { requireAppAuth } from '@/lib/auth'
import { dashboardSummary } from '@/lib/db'
import { json } from '@/lib/http'

export const Route = createFileRoute('/api/dashboard')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await requireAppAuth(request)
        return json(await dashboardSummary())
      },
    },
  },
})
