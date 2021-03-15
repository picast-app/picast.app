import { togglePrint } from 'utils/logger'
import { wrap } from 'comlink'
import type { Remote } from 'comlink'
import type { API as MainAPI } from 'main/main.worker'

declare let self: ServiceWorkerGlobalScope
export default null

const VERSION = 1
const CACHE_PREFIX = `${self.location.hostname}.v${VERSION}.`
const STATIC_CACHE = CACHE_PREFIX + 'static'
const PHOTO_CACHE = CACHE_PREFIX + 'photo'

const expectedCaches = [STATIC_CACHE, PHOTO_CACHE]

const IS_LOCAL = ['localhost', '127.0.0.1'].includes(self.location.hostname)

let setMainWorker: (v: Remote<MainAPI>) => void
const mainWorker: Promise<Remote<MainAPI>> = new Promise(res => {
  setMainWorker = res
})

self.addEventListener('message', ({ data: { type, ...data } }) => {
  logger.info('sw msg', type, data)
  if (type === 'MAIN_WORKER_PORT') {
    const main = wrap<MainAPI>(data.port)
    setMainWorker(main)
    main.idbGet('meta', 'print-logs').then(togglePrint)
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

self.addEventListener('push', event => {
  event.waitUntil(handleNotification(event))
})

self.addEventListener('notificationclick', event => {
  event.waitUntil(handleNotificationClick(event))
})

async function handleNotification(event: PushEvent) {
  logger.info('push event', Notification?.permission)
  if (Notification?.permission !== 'granted') return
  const { type, payload } = event.data?.json()
  logger.info({ type, payload })
  if (type !== 'episode') return

  await self.registration.showNotification(payload.podcast.title, {
    body: payload.episode.title,
    icon: payload.podcast.artwork,
    data: {
      podcast: payload.podcast.id,
      episode: payload.episode.id,
    },
  })
}

async function handleNotificationClick({
  notification,
  action,
}: NotificationEvent) {
  logger.info('notification clicked', action)
  notification.close()
  if (action === 'close') return
  const url = `/show/${notification.data.podcast}`
  const clients = (await self.clients.matchAll({
    type: 'window',
  })) as WindowClient[]
  const activeClient = clients.find(
    client => client.visibilityState === 'visible'
  )
  if (activeClient) await activeClient.navigate(url)
  else if (clients.length) await clients[0].navigate(url)
  else await self.clients.openWindow(url)
}

type FetchHandler<T extends boolean = false> = (
  e: FetchEvent
) => T extends false ? Promise<Response | void> : Promise<Response>

const staticHandler: FetchHandler = async e => {
  if (e.request.method !== 'GET' || IS_LOCAL) return
  const isNav = e.request.mode === 'navigate'
  if (isNav) e.waitUntil(checkForUpdate())
  const cache = await caches.open(STATIC_CACHE)
  return await cache.match(isNav ? '/index.html' : e.request)
}

const coverHandler: FetchHandler = async e => {
  if (!e.request.url.includes(process.env.IMG_HOST!)) return
  const cache = await caches.open(PHOTO_CACHE)
  return (
    (await cache.match(e.request)) ??
    fetch(e.request, !IS_LOCAL ? { mode: 'cors' } : undefined).then(
      response => (
        e.waitUntil(cache.put(e.request, response.clone())), response
      )
    )
  )
}

const defaultHandler: FetchHandler<true> = async e => await fetch(e.request)

// prettier-ignore
const handleFetch = async (e: FetchEvent): Promise<Response> =>
  // @ts-ignore
  await staticHandler(e) ?? 
  await coverHandler(e) ??
  await defaultHandler(e)

self.addEventListener('fetch', event => {
  if (event.request.destination === 'audio') return
  // https://bugs.chromium.org/p/chromium/issues/detail?id=823392
  if (
    event.request.cache === 'only-if-cached' &&
    event.request.mode !== 'same-origin'
  )
    return
  event.respondWith(handleFetch(event))
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
  logger.info('check for update')
  const main = await mainWorker
  const updateStatus = await main.idbGet('meta', 'updateStatus')

  if (updateStatus === 'UP_TO_DATE') {
    logger.info('up to date')
    const cache = await caches.open(STATIC_CACHE)
    const cached = await cache.match('/index.html')
    if (!cached) return
    const latest = await fetch('/index.html').then(res => res.text())
    if ((await cached.text()) !== latest) {
      await cacheStatic()
      await main.idbPut('meta', 'updateStatus', 'EVICT_PENDING')
      const clients = await self.clients.matchAll()
      clients.forEach(client =>
        client.postMessage?.({ type: 'UPDATE_AVAILABLE' })
      )
    }
  } else if (updateStatus === 'EVICT_PENDING') {
    logger.info('fetch update')
    const staticFiles = await getStatic()
    const cache = await caches.open(STATIC_CACHE)
    const keys = await cache.keys()
    const toEvict = keys.filter(
      ({ url }) => !staticFiles.includes(url.replace(self.location.origin, ''))
    )
    await Promise.all(toEvict.map(v => cache.delete(v)))
    await main.idbPut('meta', 'updateStatus', 'UP_TO_DATE')
  }
}
