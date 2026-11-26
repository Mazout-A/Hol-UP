// Service worker d'English Game : le site fonctionne sans connexion après la première visite.
// Ce fichier est un MODÈLE : astro.config.mjs le complète à chaque « astro build »
// (liste des fichiers + numéro de version) et l'écrit dans dist/sw.js.

const VERSION = '__VERSION__'
const CACHE = `english-game-${VERSION}`
const PRECACHE = __PRECACHE__

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

// Supprime les caches des anciennes versions du site
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('english-game-') && key !== CACHE)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  )
})

// Une page s'enregistre toujours avec un « / » final : /library -> /library/
const pageKey = (url) => (url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`)

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(respond(event, request, url))
})

// Réponse immédiate depuis le cache, et mise à jour du cache en arrière-plan
async function respond(event, request, url) {
  const cache = await caches.open(CACHE)
  const isPage = request.mode === 'navigate'
  const key = isPage ? pageKey(url) : request.url

  const cached = await cache.match(key, { ignoreSearch: true })

  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(key, response.clone())
      return response
    })
    .catch(() => null)

  if (cached) {
    event.waitUntil(refresh)
    return cached
  }

  const response = await refresh
  if (response) return response

  // Hors ligne et page jamais visitée : on retombe sur l'accueil
  if (isPage) {
    const home = await cache.match('/')
    if (home) return home
  }
  return Response.error()
}
