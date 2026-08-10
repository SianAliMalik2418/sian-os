/// <reference types="vite/client" />

import '@tanstack/react-start'

declare module '*.css?url' {
  const href: string
  export default href
}
