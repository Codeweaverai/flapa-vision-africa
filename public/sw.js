
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `skillpulse-static-${CACHE_VERSION}`;
const API_CACHE = `skillpulse-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `skillpulse-images-${CACHE_VERSION}`;
const FONT_CACHE = `skillpulse-fonts-${CACHE_VERSION}`;

// Cache duration settings (in seconds)
const CACHE_DURATIONS = {
  static: 31536000, // 1 year for static assets
  api: 300, // 5 minutes for API responses
  images: 604800, // 1 week for images
  fonts: 31536000, // 1 year for fonts
};

// Static assets to precache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/lovable-uploads/27c18223-7364-4962-bccc-e8a42e0db9c0.png',
  '/offline.html'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/rest/v1/courses',
  '/rest/v1/events',
  '/rest/v1/profiles',
  '/rest/v1/categories'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
      caches.open(API_CACHE),
      caches.open(IMAGE_CACHE),
      caches.open(FONT_CACHE),
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.includes(CACHE_VERSION)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different request types
  if (isApiRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE, CACHE_DURATIONS.api));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirstWithExpiry(request, IMAGE_CACHE, CACHE_DURATIONS.images));
  } else if (isFontRequest(url)) {
    event.respondWith(cacheFirstWithExpiry(request, FONT_CACHE, CACHE_DURATIONS.fonts));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirstWithExpiry(request, STATIC_CACHE, CACHE_DURATIONS.static));
  } else if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
  }
});

// Stale-While-Revalidate: Return cached version immediately, update cache in background
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      cache.put(request, new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      }));
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  // Return cached response if fresh enough, otherwise wait for network
  if (cachedResponse) {
    const cacheTime = cachedResponse.headers.get('sw-cache-time');
    if (cacheTime && (Date.now() - parseInt(cacheTime)) < maxAge * 1000) {
      return cachedResponse;
    }
  }

  return fetchPromise;
}

// Cache First with Expiry: Check cache first, fallback to network
async function cacheFirstWithExpiry(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    const cacheTime = cachedResponse.headers.get('sw-cache-time');
    if (!cacheTime || (Date.now() - parseInt(cacheTime)) < maxAge * 1000) {
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      cache.put(request, new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      }));
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

function isApiRequest(url) {
  return url.hostname.includes('supabase.co') || 
         API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint));
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|html)$/);
}

function isImageRequest(url) {
  return url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|avif)$/);
}

function isFontRequest(url) {
  return url.pathname.match(/\.(woff|woff2|ttf|eot|otf)$/);
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/lovable-uploads/27c18223-7364-4962-bccc-e8a42e0db9c0.png',
    badge: '/lovable-uploads/27c18223-7364-4962-bccc-e8a42e0db9c0.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
