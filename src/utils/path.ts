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

// Set specified path to value. creates new object and leaves original intact.
// Properties not specified in path will not be cloned.
export const set = (
  obj: any | undefined,
  value: any,
  ...path: string[]
): any => {
  if (!path.length) return value
  if (!path[0]) return set(obj, value, ...path.slice(1))
  return { ...obj, [path[0]]: set(obj?.[path[0]], value, ...path.slice(1)) }
}

// set path in place
export const mutate = <T>(
  obj: Record<string | number, any>,
  value: T,
  ...[next, ...rest]: string[]
): T => {
  if (!next) throw Error('must specify path')
  if (!rest.length) return (obj[next] = value)
  if (typeof obj[next] !== 'object' || obj[next] === null) obj[next] = {}
  return mutate(obj[next], value, ...rest)
}
