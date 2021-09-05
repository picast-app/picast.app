import 'polyfills'
import { togglePrint } from 'utils/logger'
import { asyncNullishChain } from 'utils/function'
import { expose, wrap, Wrapped } from '@picast-app/fiber'
import dbProm from 'main/idb/idb'
import type { API as UIAPI } from 'uiThreadAPI'
import { retry } from 'utils/promise'

declare let self: ServiceWorkerGlobalScope
export default null

const VERSION = 1
const CACHE_PREFIX = `${self.location.hostname}.v${VERSION}.`
const STATIC_CACHE = CACHE_PREFIX + 'static'
const PHOTO_CACHE = CACHE_PREFIX + 'photo'
const expectedCaches = [STATIC_CACHE, PHOTO_CACHE]
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(self.location.hostname)
const IMG_HOST = /^https:\/\/(img|photon)\.picast\.app/

const fiberAPI = {
  toggleLogger(enabled: boolean) {
    togglePrint(enabled)
  },
}
export type API = typeof fiberAPI

const clients = new WeakMap<WindowClient, Wrapped<UIAPI>>()
const getClientAPI = async (client: WindowClient) =>
  await retry(10, 100, () => {
    const api = clients.get(client)
    if (!api) throw Error(`client ${client.id} isn't wrapped`)
    return api
  })

self.addEventListener('message', e => {
  if (e.data.type === 'UI_PORT') {
    if (!(e.source instanceof WindowClient) || clients.has(e.source)) return

    // fixme: first exposing, then wrapping leads to error
    const uiThread = wrap<UIAPI>(
      e.data.port,
      process.env.NODE_ENV !== 'production'
    )
    expose(fiberAPI, e.data.port, process.env.NODE_ENV !== 'production')
    clients.set(e.source, uiThread)
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

  try {
    await (
      await getClientAPI(
        clients.find(client => client.visibilityState === 'visible') ??
          clients[0]
      )
    ).navigate(url)
  } catch (e) {
    logger.error('failed to navigate in client', e)
    await self.clients.openWindow(url)
  }
}

const staticHandler = async (e: FetchEvent) => {
  if (e.request.method !== 'GET' || IS_LOCAL) return
  const isNav = e.request.mode === 'navigate'
  if (isNav) e.waitUntil(checkForUpdate())
  const cache = await caches.open(STATIC_CACHE)
  return await cache.match(isNav ? '/index.html' : e.request)
}

const coverHandler = async (e: FetchEvent) => {
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

const shareHandler = async (e: FetchEvent) => {
  if (
    e.request.method !== 'POST' ||
    new URL(e.request.url).pathname !== '/import'
  )
    return

  const data = await e.request.formData()
  const client = await self.clients.get(e.clientId)
  if (client) await importOPML(data.get('opml')!, client as WindowClient)
  return new Response(null, { status: 200 })
}

const defaultHandler = async (e: FetchEvent) => await fetch(e.request)

const handleFetch = asyncNullishChain(
  staticHandler,
  coverHandler,
  shareHandler,
  defaultHandler
)

self.addEventListener('fetch', event => {
  if (/audio|video|font|style/.test(event.request.destination)) return
  if (
    event.request.destination === 'image' &&
    !event.request.url.startsWith(self.location.origin) &&
    !IMG_HOST.test(event.request.url)
  )
    return

  // https://bugs.chromium.org/p/chromium/issues/detail?id=823392
  if (
    event.request.cache === 'only-if-cached' &&
    event.request.mode !== 'same-origin'
  )
    return

  event.respondWith(handleFetch(event) as any)
})

async function importOPML(opml: File | string, client: WindowClient) {
  logger.info('import', { opml, client })
  const readFile = async (file: File) =>
    new Promise<string>(res => {
      const reader = new FileReader()
      reader.addEventListener('load', e => res(e.target!.result as string))
      reader.readAsText(file)
    })

  const content = typeof opml === 'string' ? opml : await readFile(opml)
  logger.info({ content })
  const api = await getClientAPI(client)
  logger.info({ api })
  await api.navigate(`/settings/general?opml=${encodeURIComponent(content)}`)
}

async function cacheStatic() {
  const [cache, staticFiles] = await Promise.all([
    caches.open(STATIC_CACHE),
    getStatic(),
  ])
  const external = staticFiles.filter(v => /^https?:\/\//.test(v))
  await cache.addAll(staticFiles.filter(v => !external.includes(v)))
}

async function getStatic() {
  const { files } = await fetch('/asset-manifest.json', {
    cache: 'no-cache',
  }).then(res => res.json())
  const staticFiles = (Object.values(files) as string[]).filter(
    file => !/\.map$/.test(file)
  )

  const html = await fetch('/index.html', { cache: 'no-cache' }).then(res =>
    res.text()
  )

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
  const idb = await dbProm
  const updateStatus = await idb.get('meta', 'updateStatus')

  if (updateStatus === 'UP_TO_DATE') {
    logger.info('up to date')
    const cache = await caches.open(STATIC_CACHE)
    const cached = await cache.match('/index.html')
    if (!cached) return
    const latest = await fetch('/index.html', { cache: 'no-cache' }).then(res =>
      res.text()
    )
    if ((await cached.text()) !== latest) {
      await cacheStatic()
      await idb.put('meta', 'EVICT_PENDING', 'updateStatus')
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
    await idb.put('meta', 'UP_TO_DATE', 'updateStatus')
  }
}
