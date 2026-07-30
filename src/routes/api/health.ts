import { createFileRoute } from '@tanstack/react-router'
import { json } from '@/lib/http'

export const Route = createFileRoute('/api/health')({
  server: { handlers: { GET: () => json({ ok: true, app: 'sian-os' }) } },
})
