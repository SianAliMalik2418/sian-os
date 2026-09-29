import { db } from '@/lib/db'
import { HttpError } from '@/lib/http'
import type { DevicePushToken } from '@/lib/types'

// This codebase has no standalone `Env` type export: `cloudflare:workers`'s `env` singleton is
// typed as `Cloudflare.Env`, the global namespace `worker-configuration.d.ts` augments (see
// src/lib/db.ts). We alias it here so the exported functions read as `env: Env` per spec.
type Env = Cloudflare.Env

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlEncodeString(value: string): string {
  return base64UrlEncode(new TextEncoder().encode(value))
}

function pemToDer(pem: string): ArrayBuffer {
  const stripped = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '')
  const binary = atob(stripped)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export async function signServiceAccountJwt(env: Env): Promise<string> {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: env.FCM_CLIENT_EMAIL,
    sub: env.FCM_CLIENT_EMAIL,
    aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  }
  const headerB64 = base64UrlEncodeString(JSON.stringify(header))
  const payloadB64 = base64UrlEncodeString(JSON.stringify(payload))
  const unsigned = `${headerB64}.${payloadB64}`

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(env.FCM_PRIVATE_KEY ?? ''),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
  const signatureB64 = base64UrlEncode(new Uint8Array(signature))

  return `${unsigned}.${signatureB64}`
}

function assertFcmConfigured(env: Env) {
  if (!env.FCM_PROJECT_ID || !env.FCM_CLIENT_EMAIL || !env.FCM_PRIVATE_KEY) {
    throw new HttpError(500, 'FCM_NOT_CONFIGURED', 'FCM_PROJECT_ID/FCM_CLIENT_EMAIL/FCM_PRIVATE_KEY are not all set')
  }
}

export async function getAccessToken(env: Env): Promise<string> {
  assertFcmConfigured(env)
  const jwt = await signServiceAccountJwt(env)
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${encodeURIComponent(jwt)}`,
  })
  const body = await response.text()
  if (!response.ok) {
    throw new Error(`FCM OAuth token request failed (${response.status}): ${body}`)
  }
  const parsed = JSON.parse(body) as { access_token?: string }
  if (!parsed.access_token) {
    throw new Error(`FCM OAuth token response missing access_token: ${body}`)
  }
  return parsed.access_token
}

function isUnregisteredFcmError(errorBody: unknown): boolean {
  if (!errorBody || typeof errorBody !== 'object') return false
  const error = (errorBody as { error?: { status?: string; details?: Array<{ errorCode?: string }> } }).error
  if (!error) return false
  if (error.status === 'NOT_FOUND' || error.status === 'UNREGISTERED') return true
  return (error.details ?? []).some((detail) => detail.errorCode === 'UNREGISTERED')
}

export async function sendSyncPush(env: Env): Promise<{ requested: number }> {
  // Deliberately first and unconditional: a misconfigured deployment must fail loudly here
  // even with zero registered devices, instead of silently reporting requested: 0.
  const accessToken = await getAccessToken(env)

  const tokens = await db().prepare('SELECT * FROM device_push_tokens').all<DevicePushToken>()
  const rows = tokens.results
  if (rows.length === 0) return { requested: 0 }

  await Promise.all(rows.map(async (row) => {
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${env.FCM_PROJECT_ID}/messages:send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: row.fcm_token,
          data: { action: 'sync_now' },
        },
      }),
    })
    if (response.ok) return

    const bodyText = await response.text()
    let parsedBody: unknown
    try {
      parsedBody = JSON.parse(bodyText)
    } catch {
      parsedBody = undefined
    }

    if (isUnregisteredFcmError(parsedBody)) {
      await db().prepare('DELETE FROM device_push_tokens WHERE id = ?').bind(row.id).run()
      return
    }

    console.error(`FCM send failed for device_push_tokens.id=${row.id} (${response.status}): ${bodyText}`)
  }))

  return { requested: rows.length }
}
