export const none = Symbol('none')

export const pick = <T = unknown>(
  obj: Record<string | number, any>,
  ...path: string[]
): T | typeof none =>
  path.length === 0
    ? (obj as T)
    : typeof obj === 'object' && obj !== null && path[0] in obj
    ? pick(obj[path[0]], ...path.slice(1))
    : none
