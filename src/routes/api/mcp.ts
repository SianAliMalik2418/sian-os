import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import { z } from 'zod'
import { findTool, tools } from '@/lib/mcp/tools'

const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']
const SERVER_INFO = { name: 'sian-os', title: 'Sian OS Health', version: '1.0.0' }

type JsonRpcRequest = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: unknown }

function rpcResult(id: string | number | null | undefined, result: unknown) {
  return Response.json({ jsonrpc: '2.0', id: id ?? null, result })
}

function rpcError(id: string | number | null | undefined, code: number, message: string) {
  return Response.json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, { status: 200 })
}

function toolResult(data: unknown, isError = false) {
  return { content: [{ type: 'text', text: JSON.stringify(data ?? null) }], isError }
}

function unauthorized() {
  return new Response('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } })
}

function isAuthorized(request: Request) {
  if (!env.MCP_API_KEY) return true
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined
  return token === env.MCP_API_KEY
}

async function callTool(name: string, args: unknown, origin: string) {
  const tool = findTool(name)
  if (!tool) return toolResult({ error: `Unknown tool: ${name}` }, true)

  const parsed = tool.argsSchema.safeParse(args ?? {})
  if (!parsed.success) return toolResult({ error: 'Invalid arguments', details: z.treeifyError(parsed.error) }, true)

  const built = tool.buildRequest(parsed.data as never)
  let response: Response
  try {
    response = await env.SELF.fetch(new URL(built.path, origin), {
      method: built.method,
      headers: built.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: built.body === undefined ? undefined : JSON.stringify(built.body),
    })
  } catch (caught) {
    return toolResult({ error: caught instanceof Error ? caught.message : 'Request to Sian OS failed' }, true)
  }
  const text = await response.text()
  const payload = (() => {
    try {
      return JSON.parse(text)
    } catch {
      return { error: text || `Unexpected ${response.status} response` }
    }
  })()
  return toolResult(payload, !response.ok)
}

async function handleRpc(message: JsonRpcRequest, origin: string) {
  const { id, method, params } = message
  const isNotification = id === undefined

  switch (method) {
    case 'initialize': {
      const requested = (params as { protocolVersion?: string } | undefined)?.protocolVersion
      const protocolVersion = requested && SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : SUPPORTED_PROTOCOL_VERSIONS[0]
      return rpcResult(id, { protocolVersion, capabilities: { tools: {} }, serverInfo: SERVER_INFO })
    }
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null
    case 'ping':
      return isNotification ? null : rpcResult(id, {})
    case 'tools/list':
      return rpcResult(id, { tools: tools.map((tool) => ({ name: tool.name, description: tool.description, inputSchema: z.toJSONSchema(tool.argsSchema) })) })
    case 'tools/call': {
      const callParams = params as { name: string; arguments?: unknown }
      const result = await callTool(callParams.name, callParams.arguments, origin)
      return rpcResult(id, result)
    }
    case 'resources/list':
      return rpcResult(id, { resources: [] })
    case 'resources/templates/list':
      return rpcResult(id, { resourceTemplates: [] })
    case 'prompts/list':
      return rpcResult(id, { prompts: [] })
    default:
      return isNotification ? null : rpcError(id, -32601, `Method not found: ${method}`)
  }
}

export const Route = createFileRoute('/api/mcp')({
  server: {
    handlers: {
      GET: () => new Response('Method Not Allowed', { status: 405 }),
      DELETE: () => new Response(null, { status: 204 }),
      POST: async ({ request }) => {
        if (!isAuthorized(request)) return unauthorized()

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return rpcError(null, -32700, 'Parse error')
        }

        const origin = new URL(request.url).origin
        const messages = Array.isArray(body) ? body : [body]
        const responses = await Promise.all(messages.map((message) => handleRpc(message as JsonRpcRequest, origin)))
        const results = responses.filter((response): response is Response => response !== null)

        if (!results.length) return new Response(null, { status: 202 })
        if (results.length === 1) return results[0]
        const bodies = await Promise.all(results.map((response) => response.json()))
        return Response.json(bodies)
      },
    },
  },
})
