const CACHE_NAME = 'quiz-app-v3';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icon-192x192.png',
    './icon-512x512.png',
    'https://i.top4top.io/p_37242nuz81.jpg',
    './fonts/Tajawal-Regular.ttf',
    './fonts/Tajawal-Bold.ttf',
    './audio/beep_short.ogg',
    './audio/stadium_crowd_cheer.ogg',
    './audio/brass_fanfare_with_timpani.ogg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            return Promise.allSettled(
                ASSETS_TO_CACHE.map(url => fetch(url).then(response => {
                    if (response.ok || response.type === 'opaque') {
                        return cache.put(url, response);
                    }
                }).catch(err => console.error('Failed to cache:', url)))
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
        .then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request).then((fetchResponse) => {
                if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                    if (fetchResponse && fetchResponse.type === 'opaque') {
                        let responseToCache = fetchResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return fetchResponse;
                }
                let responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return fetchResponse;
            }).catch(() => {
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

/*
شرح الخطأ:
نعم كلام الزبون صحيح. الخطأ كان في ملف sw.js في دالة cache.addAll(). هذه الدالة تتوقف عن العمل وتلغي تثبيت الـ Service Worker بالكامل إذا كان هناك ملف واحد مفقود أو رابطه خاطئ (مثل مسار صورة ./images/bg-logo.jpg بينما أنت تستخدم رابط خارجي في الـ css). وعندما يفشل التثبيت، التطبيق لا يعمل بدون إنترنت.

تم تعديل الكود لتخزين الملفات بشكل فردي عبر Promise.allSettled، بحيث إذا فُقد أي ملف لا يتوقف النظام ويقوم بحفظ باقي الملفات. كما تم إضافة نظام (Dynamic Caching) ليقوم التطبيق بحفظ أي صور أو ملفات يتم فتحها تلقائياً ليتم عرضها في وضع الأوفلاين.
*/
