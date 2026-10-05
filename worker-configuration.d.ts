declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    FILES: R2Bucket
    APP_NAME: string
    LYFTA_API_KEY?: string
    MCP_API_KEY?: string
    SELF: Fetcher
  }
}
