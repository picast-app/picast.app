// ??=
export const nullSet = <K, V>(map: Map<K, V>, key: K, value: V): V => {
  if (map.has(key)) return map.get(key)!
  map.set(key, value)
  return value
}

export const remove = <K, V>(map: Map<K, V>, key: K): V | undefined => {
  if (!map.has(key)) return
  const v = map.get(key)
  map.delete(key)
  return v
}
