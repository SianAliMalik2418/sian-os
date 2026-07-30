export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init)
}

export async function readJson<T>(request: Request) {
  return (await request.json()) as T
}
