import type { BibleBook, BibleVerse } from '$lib/api/bible';

const DB_NAME = 'discipulado-bible-db';
const DB_VERSION = 1;
const STORE_CHAPTERS = 'chapters';
const STORE_BOOKS = 'books';

function openDB(): Promise<IDBDatabase | null> {
	if (typeof window === 'undefined' || !('indexedDB' in window)) {
		return Promise.resolve(null);
	}

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_CHAPTERS)) {
				db.createObjectStore(STORE_CHAPTERS);
			}
			if (!db.objectStoreNames.contains(STORE_BOOKS)) {
				db.createObjectStore(STORE_BOOKS);
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function getCachedBooks(version: string = 'rvr1960'): Promise<BibleBook[] | null> {
	try {
		const db = await openDB();
		if (!db) return null;

		return new Promise((resolve) => {
			const tx = db.transaction(STORE_BOOKS, 'readonly');
			const store = tx.objectStore(STORE_BOOKS);
			const request = store.get(`books:${version}`);

			request.onsuccess = () => resolve(request.result ?? null);
			request.onerror = () => resolve(null);
		});
	} catch {
		return null;
	}
}

export async function setCachedBooks(books: BibleBook[], version: string = 'rvr1960'): Promise<void> {
	try {
		const db = await openDB();
		if (!db) return;

		return new Promise((resolve) => {
			const tx = db.transaction(STORE_BOOKS, 'readwrite');
			const store = tx.objectStore(STORE_BOOKS);
			store.put(books, `books:${version}`);

			tx.oncomplete = () => resolve();
			tx.onerror = () => resolve();
		});
	} catch {
		// Ignore storage errors in restricted contexts
	}
}

export async function getCachedChapter(
	bookSlug: string,
	chapter: number,
	translation: string = 'rvr1960'
): Promise<BibleVerse[] | null> {
	try {
		const db = await openDB();
		if (!db) return null;

		const key = `${translation}:${bookSlug.toLowerCase()}:${chapter}`;
		return new Promise((resolve) => {
			const tx = db.transaction(STORE_CHAPTERS, 'readonly');
			const store = tx.objectStore(STORE_CHAPTERS);
			const request = store.get(key);

			request.onsuccess = () => resolve(request.result ?? null);
			request.onerror = () => resolve(null);
		});
	} catch {
		return null;
	}
}

export async function setCachedChapter(
	bookSlug: string,
	chapter: number,
	verses: BibleVerse[],
	translation: string = 'rvr1960'
): Promise<void> {
	try {
		const db = await openDB();
		if (!db) return;

		const key = `${translation}:${bookSlug.toLowerCase()}:${chapter}`;
		return new Promise((resolve) => {
			const tx = db.transaction(STORE_CHAPTERS, 'readwrite');
			const store = tx.objectStore(STORE_CHAPTERS);
			store.put(verses, key);

			tx.oncomplete = () => resolve();
			tx.onerror = () => resolve();
		});
	} catch {
		// Ignore storage errors
	}
}

export interface CachedChapterEntry {
	key: string;
	translation: string;
	bookSlug: string;
	chapter: number;
	verses: BibleVerse[];
}

export async function getAllCachedChapters(): Promise<CachedChapterEntry[]> {
	try {
		const db = await openDB();
		if (!db) return [];

		return new Promise((resolve) => {
			const tx = db.transaction(STORE_CHAPTERS, 'readonly');
			const store = tx.objectStore(STORE_CHAPTERS);
			const request = store.openCursor();
			const entries: CachedChapterEntry[] = [];

			request.onsuccess = (event) => {
				const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
				if (cursor) {
					const key = String(cursor.key);
					const parts = key.split(':');
					if (parts.length === 3) {
						entries.push({
							key,
							translation: parts[0],
							bookSlug: parts[1],
							chapter: parseInt(parts[2], 10),
							verses: cursor.value as BibleVerse[]
						});
					}
					cursor.continue();
				} else {
					resolve(entries);
				}
			};

			request.onerror = () => resolve([]);
		});
	} catch {
		return [];
	}
}
