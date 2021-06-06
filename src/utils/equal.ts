export default function equals(a: unknown, b: unknown): boolean {
  if (typeof a !== 'object' && typeof b !== 'object') return a === b
  if (a === b) return true // null or ref equality
  if (Array.isArray(a) !== Array.isArray(b)) return false

  if (Object.keys(a as any).length !== Object.keys(b as any).length)
    return false

  return Object.entries(a as any).every(
    ([k, v]) => k in (b as any) && equals(v, (b as any)[k])
  )
}
