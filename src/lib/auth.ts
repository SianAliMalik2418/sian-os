import { env } from 'cloudflare:workers'
import { parse, serialize } from 'cookie'

const cookieName = 'sian_os_session'

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sign(value: string) {
  const secret = env.SESSION_SECRET || 'dev-only-change-me'
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))
}

export async function makeSessionCookie() {
  const payload = JSON.stringify({ sub: 'sian', exp: Date.now() + 1000 * 60 * 60 * 24 * 30 })
  const encoded = btoa(payload)
  const signature = await sign(encoded)
  return serialize(cookieName, `${encoded}.${signature}`, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export function clearSessionCookie() {
  return serialize(cookieName, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 })
}

export async function isAuthenticated(request: Request) {
  const value = parse(request.headers.get('cookie') || '')[cookieName]
  if (!value) return false
  const [encoded, signature] = value.split('.')
  if (!encoded || !signature) return false
  if ((await sign(encoded)) !== signature) return false
  try {
    const payload = JSON.parse(atob(encoded)) as { exp?: number }
    return typeof payload.exp === 'number' && payload.exp > Date.now()
  } catch {
    return false
  }
}

export async function requireAppAuth(request: Request) {
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer && env.AGENT_API_TOKEN && bearer === env.AGENT_API_TOKEN) return
  if (await isAuthenticated(request)) return
  throw new Response('Unauthorized', { status: 401 })
}

export function passwordMatches(password: string) {
  const expected = env.APP_PASSWORD || 'change-me'
  return password === expected
}
