import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function createRouter() {
  return createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultPendingComponent: () => <div className="dark grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Loading Sian OS…</div>,
    defaultErrorComponent: ({ reset }) => <div className="dark grid min-h-screen place-items-center bg-background px-4 text-foreground"><div className="max-w-md rounded-2xl border bg-card p-6 text-center"><h1 className="font-heading text-xl font-semibold">Something went wrong</h1><p className="mt-2 text-sm text-muted-foreground">The page could not be loaded. Try again, then check the Worker logs if the problem continues.</p><button type="button" onClick={reset} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button></div></div>,
  })
}

export function getRouter() {
  return createRouter()
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
