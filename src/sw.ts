import { ChannelManager } from 'utils/msgChannel'
import logger from 'utils/logger'

declare let self: ServiceWorkerGlobalScope
export default null

const VERSION = 1
const CACHE_PREFIX = `${self.location.hostname}.v${VERSION}.`
const STATIC_CACHE = CACHE_PREFIX + 'static'
const PHOTO_CACHE = CACHE_PREFIX + 'photo'

const expectedCaches = [STATIC_CACHE, PHOTO_CACHE]

const IS_LOCAL = ['localhost', '127.0.0.1'].includes(self.location.hostname)

const channels = new ChannelManager('service')

self.addEventListener('message', ({ data }) => {
  if (typeof data !== 'object') return
  const msg: WorkerMsg = data
  if (typeof data?.type !== 'string') return
  if (msg.type === 'ADD_MSG_CHANNEL') {
    const { target, port } = (msg as WorkerMsg<'ADD_MSG_CHANNEL'>).payload
    channels.addChannel(target as Exclude<WorkerName, 'service'>, port)
  }
})

self.addEventListener('install', event => {
  if (IS_LOCAL) return
  event.waitUntil(cacheStatic())
})

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches
        .keys()
        .then(keys =>
          Promise.all(
            keys.map(key => !expectedCaches.includes(key) && caches.delete(key))
          )
        ),
    ])
  )
})

self.addEventListener('fetch', event => {
  const handleDefault = async () => {
    if (IS_LOCAL) return fetch(event.request)
    const cache = await caches.open(STATIC_CACHE)
    const isNav = event.request.mode === 'navigate'
    if (isNav) event.waitUntil(checkForUpdate())
    return (
      (await cache.match(isNav ? '/index.html' : event.request)) ??
      fetch(event.request)
    )
  }

  const handlePhoto = async () => {
    const cache = await caches.open(PHOTO_CACHE)
    const match = await cache.match(event.request)
    const fetchProm = fetch(event.request).then(res =>
      cache.put(event.request, res.clone()).then(() => res)
    )
    event.waitUntil(fetchProm)
    return match ?? fetchProm
  }

  event.respondWith(
    event.request.method === 'POST'
      ? fetch(event.request)
      : event.request.url.startsWith(
          process.env.REACT_APP_PHOTO_BUCKET as string
        )
      ? handlePhoto()
      : handleDefault()
  )
})

async function cacheStatic() {
  const [cache, staticFiles] = await Promise.all([
    caches.open(STATIC_CACHE),
    getStatic(),
  ])
  const external = staticFiles.filter(v => /^https?:\/\//.test(v))
  await cache.addAll(staticFiles.filter(v => !external.includes(v)))
}

async function getStatic() {
  const { files } = await fetch('/asset-manifest.json').then(res => res.json())
  const staticFiles = (Object.values(files) as string[]).filter(
    file => !/\.map$/.test(file)
  )

  const html = await fetch('/index.html').then(res => res.text())

  try {
    const head = html.match(/<head>(.*)(?=<\/head>)/s)?.[1]
    const links =
      head?.match(/href="([^"]+)/gs)?.map(v => v.replace(/^href="/, '')) ?? []
    staticFiles.push(...links)
  } catch (e) {
    logger.warn(e)
  }

  return Array.from(new Set(staticFiles))
}

async function checkForUpdate() {
  const { payload: updateStatus } = await channels.post<'DB_READ', 'DB_DATA'>(
    'main',
    'DB_READ',
    {
      table: 'meta',
      key: 'updateStatus',
    }
  )

  if (updateStatus === 'UP_TO_DATE') {
    const cache = await caches.open(STATIC_CACHE)
    const cached = await cache.match('/index.html')
    if (!cached) return
    const latest = await fetch('/index.html').then(res => res.text())
    if ((await cached.text()) !== latest) {
      await cacheStatic()
      channels.post('main', 'DB_WRITE', {
        table: 'meta',
        key: 'updateStatus',
        data: 'EVICT_PENDING',
      })
      const clients = await self.clients.matchAll()
      clients.forEach(client =>
        client.postMessage?.({ type: 'UPDATE_AVAILABLE' })
      )
    }
  } else if (updateStatus === 'EVICT_PENDING') {
    const staticFiles = await getStatic()
    const cache = await caches.open(STATIC_CACHE)
    const keys = await cache.keys()
    const toEvict = keys.filter(
      ({ url }) => !staticFiles.includes(url.replace(self.location.origin, ''))
    )
    await Promise.all(toEvict.map(v => cache.delete(v)))
    channels.post('main', 'DB_WRITE', {
      table: 'meta',
      key: 'updateStatus',
      data: 'UP_TO_DATE',
    })
  }
}
