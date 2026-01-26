// Service Worker for Offline Support
const CACHE_NAME = 'auto-backup-v2.0';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/animations.css',
  '/backup-core.js',
  '/data-miner.js',
  '/telegram-api.js',
  '/config.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install Event
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate Event
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip Chrome extensions
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  // Skip analytics
  if (event.request.url.includes('google-analytics.com')) return;
  
  // Handle API requests
  if (event.request.url.includes('api.telegram.org')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if available
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For navigation requests, try network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }
  
  // For other requests, cache first
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Update cache in background
          fetch(event.request)
            .then(response => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
            })
            .catch(() => { /* Ignore update errors */ });
          
          return cachedResponse;
        }
        
        // Not in cache, try network
        return fetch(event.request)
          .then(response => {
            // Cache successful responses
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(error => {
            console.log('Fetch failed:', error);
            throw error;
          });
      })
  );
});

// Background Sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-backup') {
    event.waitUntil(syncBackupData());
  }
});

async function syncBackupData() {
  console.log('Background Sync: Syncing backup data...');
  
  try {
    // Get pending backups from IndexedDB
    const pending = await getPendingBackups();
    
    for (const backup of pending) {
      await sendBackupToTelegram(backup);
      await markBackupAsSent(backup.id);
    }
    
    console.log(`Background Sync: Sent ${pending.length} backups`);
  } catch (error) {
    console.error('Background Sync failed:', error);
  }
}

// Push Notifications
self.addEventListener('push', event => {
  console.log('Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Backup completed successfully!',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 'backup-notification'
    },
    actions: [
      {
        action: 'view',
        title: 'View Backup'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Auto Backup', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('Notification click received');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/?view=backup')
    );
  }
});

// Utility Functions
async function getPendingBackups() {
  // Implement IndexedDB access for pending backups
  return [];
}

async function sendBackupToTelegram(backup) {
  // Implement Telegram sending logic
  return { success: true };
}

async function markBackupAsSent(backupId) {
  // Implement backup status update
  return true;
}

// Periodic Background Sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'backup-cleanup') {
    event.waitUntil(cleanupOldBackups());
  }
});

async function cleanupOldBackups() {
  console.log('Periodic Sync: Cleaning up old backups...');
  
  // Cleanup logic here
  return Promise.resolve();
}
