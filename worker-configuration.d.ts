declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    FILES: R2Bucket
    APP_NAME: string
    APP_PASSWORD?: string
    SESSION_SECRET?: string
    AGENT_API_TOKEN?: string
  }
}
