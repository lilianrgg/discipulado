/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = `discipulado-cache-${version}`;

const ASSETS = [
	...build,
	...files
];

self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE_NAME);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE_NAME) {
				await caches.delete(key);
			}
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);

	// Cache-first strategy for static assets
	if (ASSETS.includes(url.pathname)) {
		event.respondWith(
			caches.match(event.request).then((cached) => cached || fetch(event.request))
		);
		return;
	}

	// Network-first strategy with cache fallback for external Bible API requests
	if (url.hostname.includes('midvash.com')) {
		event.respondWith(
			fetch(event.request)
				.then(async (response) => {
					if (response.ok) {
						const cache = await caches.open(`api-cache-${version}`);
						cache.put(event.request, response.clone());
					}
					return response;
				})
				.catch(async () => {
					const cached = await caches.match(event.request);
					if (cached) return cached;
					return new Response(
						JSON.stringify({ error: 'Sin conexión a internet' }),
						{ status: 503, headers: { 'Content-Type': 'application/json' } }
					);
				})
		);
		return;
	}
});
