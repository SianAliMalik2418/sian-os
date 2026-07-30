import { createFileRoute } from '@tanstack/react-router'
import { makeSessionCookie, passwordMatches } from '@/lib/auth'

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData()
        const password = String(form.get('password') || '')
        if (!passwordMatches(password)) return new Response('Invalid password', { status: 401 })
        return new Response(null, { status: 302, headers: { Location: '/', 'Set-Cookie': await makeSessionCookie() } })
      },
    },
  },
})
