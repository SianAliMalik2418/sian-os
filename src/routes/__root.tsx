import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [{ title: 'Sian OS' }, { name: 'description', content: 'Private personal fitness operating system' }],
  }),
  component: Root,
})

function Root() {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <HeadContent />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#090b0d" />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
