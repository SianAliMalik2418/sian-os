export function nullable<T>(value: T | undefined) {
  return value ?? null
}
