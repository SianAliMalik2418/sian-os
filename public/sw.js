const CACHE_VERSION = 'sian-os-v4'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const PAGE_CACHE = `${CACHE_VERSION}-pages`
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]
const OFFLINE_HTML = `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#120f24" />
    <title>Sian OS Offline</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #120f24;
        color: #fff5e8;
      }

      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at 50% 0%, rgb(255 107 44 / 26%), transparent 36%),
          #120f24;
      }

      main {
        width: min(100%, 420px);
        border: 1px solid rgb(255 255 255 / 12%);
        border-radius: 24px;
        padding: 24px;
        background: rgb(28 24 54 / 90%);
      }

      h1 {
        margin: 0;
        font-size: 1.25rem;
        line-height: 1.2;
      }

      p {
        margin: 12px 0 0;
        color: #a9a3c7;
        line-height: 1.55;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Sian OS is offline</h1>
      <p>Reconnect to load the latest check-ins, reports, and profile data.</p>
    </main>
  </body>
</html>`

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request))
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request))
  }
})

function isStaticAsset(url) {
  return url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || STATIC_ASSETS.includes(url.pathname)
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE)

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
      if (new URL(request.url).pathname === '/') {
        cache.put('/', response.clone())
      }
    }
    return response
  } catch {
    return (await cache.match(request)) || (await cache.match('/')) || offlineResponse()
  }
}

function offlineResponse() {
  return new Response(OFFLINE_HTML, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

async function cacheFirst(request) {
  const cached = await caches.match(request)

  if (cached) {
    return cached
  }

  const response = await fetch(request)

  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE)
    cache.put(request, response.clone())
  }

  return response
}
