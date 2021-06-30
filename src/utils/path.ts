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
// returns previous value at path
export const mutate = (
  obj: Record<string | number, any>,
  value: any,
  ...[next, ...rest]: string[]
): any => {
  if (!next) throw Error('must specify path')
  if (!rest.length) {
    const cur = obj[next]
    obj[next] = value
    return cur
  }
  if (typeof obj[next] !== 'object' || obj[next] === null) obj[next] = {}
  return mutate(obj[next], value, ...rest)
}

export const mergeInPlace = (
  obj: Record<string | number, any>,
  value: unknown,
  ...[next, ...rest]: string[]
) => {
  if (!next) Object.assign(obj, value)
  else if ((!rest.length && typeof value !== 'object') || value === null)
    obj[next] = value
  else {
    if (typeof obj[next] !== 'object' || obj[next] === null) obj[next] = {}
    mergeInPlace(obj[next], value, ...rest)
  }
}

export const seg = (input: string, skip = 0, ...skipped: string[]) =>
  input.split('.').slice(skip + skipped.flatMap(v => v.split('.')).length)
