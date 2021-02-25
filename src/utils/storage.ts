export const format = (bytes?: number) =>
  typeof bytes !== 'number'
    ? ''
    : bytes < 1000
    ? `${bytes} B`
    : bytes < 1e6
    ? `${Math.round(bytes / 1000)} kB`
    : bytes < 1e9
    ? `${Math.round(bytes / 1e6)} MB`
    : `${Math.round(bytes / 1e8) / 10} GB`

export async function getCacheSizes(): Promise<Record<string, number>> {
  const names = await caches.keys()

  return Object.fromEntries(
    await Promise.all(
      names.map(name => getCacheSize(name).then(size => [name, size]))
    )
  )
}

async function getCacheSize(name: string) {
  const cache = await caches.open(name)
  const keys = await cache.keys()

  const size = (
    await Promise.all(
      keys.map(key =>
        caches
          .match(key)
          .then(res => {
            if (res?.type === 'opaque') logger.warn(`${key.url} is opaque`)
            return res?.blob()
          })
          .then(blob => blob?.size ?? 0)
      )
    )
  ).reduce((a, b) => a + b)

  return size
}
