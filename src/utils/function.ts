export const callAll = <T extends any[] = []>(
  list?: ((...args: T) => any)[],
  ...args: T
) => {
  for (const cb of list ?? []) cb(...args)
}

export const ident = <T>(v: T): T => v
