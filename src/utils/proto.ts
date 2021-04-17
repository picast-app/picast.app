export const bindThis = (target: any) => {
  for (const [key, { get, value }] of Object.entries(
    Object.getOwnPropertyDescriptors(Object.getPrototypeOf(target))
  ))
    if (!get && typeof value === 'function') target[key] = value.bind(target)
}
