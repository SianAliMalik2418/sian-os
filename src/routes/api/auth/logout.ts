import { createFileRoute } from '@tanstack/react-router'
import { clearSessionCookie } from '@/lib/auth'

export const Route = createFileRoute('/api/auth/logout')({
  server: { handlers: { POST: () => new Response(null, { status: 302, headers: { Location: '/login', 'Set-Cookie': clearSessionCookie() } }) } },
})
