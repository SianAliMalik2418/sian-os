import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message)
  }
}

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init)
}

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return json({ ok: false, error: { code, message, ...(details === undefined ? {} : { details }) } }, { status })
}

export async function handleApi(handler: () => Response | Promise<Response>) {
  try {
    return await handler()
  } catch (error) {
    if (error instanceof Response) return error
    if (error instanceof HttpError) return apiError(error.status, error.code, error.message, error.details)
    if (error instanceof ZodError) return apiError(400, 'VALIDATION_ERROR', 'Request validation failed', error.flatten())
    if (error instanceof SyntaxError) return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON')
    console.error(error)
    return apiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}

export async function readJson(request: Request) {
  return request.json()
}
