import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { handleApi, json } from '@/lib/http'
import { fetchLyftaWorkouts } from '@/lib/lyfta'

export const Route = createFileRoute('/api/lyfta/workouts')({
  server: {
    handlers: {
      GET: async ({ request }) => handleApi(async () => {
        const url = new URL(request.url)
        const result = await fetchLyftaWorkouts({
          apiKey: env.LYFTA_API_KEY,
          limit: Number(url.searchParams.get('limit') ?? 20),
          page: Number(url.searchParams.get('page') ?? 1),
        })
        return json({ ok: result.available, data: result })
      }),
    },
  },
})
