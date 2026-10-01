import { config, locales, ZodError } from 'zod'

// zod sets its detailed English error messages via a side-effecting config(en()) call on import,
// but zod's package.json declares sideEffects: false, so production bundlers (Rollup via `vite
// build`) can tree-shake that call away. When that happens every zod issue falls back to the
// terse core locale ("Invalid input" for everything), which is what the Workers build was
// actually shipping. Force it explicitly here so detailed messages survive the production build.
config(locales.en())

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
  const headers = new Headers(init?.headers)
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'no-store')
  return Response.json(data, { ...init, headers })
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
    const databaseError = databaseConstraintError(error)
    if (databaseError) return apiError(databaseError.status, databaseError.code, databaseError.message, databaseError.details)
    if (error instanceof ZodError) return apiError(400, 'VALIDATION_ERROR', 'Request validation failed', error.flatten())
    if (error instanceof SyntaxError) return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON')
    console.error(error)
    return apiError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
  }
}

export async function readJson(request: Request) {
  return request.json()
}

function databaseConstraintError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (!message.includes('UNIQUE constraint failed')) return null

  if (message.includes('recipes.name')) {
    return {
      status: 409,
      code: 'DUPLICATE_RECIPE',
      message: 'A recipe with this name already exists',
      details: {
        fieldErrors: {
          name: ['Use a different recipe name.'],
        },
      },
    }
  }

  if (message.includes('recipe_bundles.name')) {
    return {
      status: 409,
      code: 'DUPLICATE_RECIPE_BUNDLE',
      message: 'A recipe bundle with this name already exists',
      details: {
        fieldErrors: {
          name: ['Use a different bundle name.'],
        },
      },
    }
  }

  return {
    status: 409,
    code: 'DUPLICATE_RECORD',
    message: 'A record with these values already exists',
    details: undefined,
  }
}
