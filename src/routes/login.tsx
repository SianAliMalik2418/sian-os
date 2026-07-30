import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({ component: Login })

function Login() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <form method="post" action="/api/auth/login" className="w-full max-w-md rounded-3xl border border-border bg-card p-8">
        <p className="mb-2 text-sm uppercase tracking-[0.25em] text-primary">Private access</p>
        <h1 className="text-3xl font-semibold">Sign in to Sian OS</h1>
        <p className="mt-2 text-sm text-muted">Use your app password. Set APP_PASSWORD as a Cloudflare Worker secret before production.</p>
        <input name="password" type="password" placeholder="Password" className="mt-6 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary" />
        <button className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground">Sign in</button>
      </form>
    </main>
  )
}
