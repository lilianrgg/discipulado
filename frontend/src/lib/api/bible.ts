export interface BibleBook {
	names: string[];
	slug: string;
	chapters: number;
}

export interface BibleVerse {
	number: number;
	text: string;
	study?: string;
	id?: number;
}

export interface BibleChapterResponse {
	book: string;
	chapter: number;
	translation: string;
	verses: BibleVerse[];
}

export class BibleApiError extends Error {
	constructor(
		message: string,
		public statusCode?: number
	) {
		super(message);
		this.name = 'BibleApiError';
	}
}

const BASE_URL = 'https://bible-api.deno.dev/api';
const DEFAULT_TRANSLATION = 'rv1960';

/**
 * Fetches all available books of the Bible.
 */
export async function getBooks(fetchFn: typeof fetch = fetch): Promise<BibleBook[]> {
	try {
		const res = await fetchFn(`${BASE_URL}/books`);
		if (!res.ok) {
			throw new BibleApiError(`Failed to fetch Bible books: ${res.statusText}`, res.status);
		}
		return await res.json();
	} catch (error) {
		if (error instanceof BibleApiError) throw error;
		throw new BibleApiError(`Network error fetching Bible books: ${(error as Error).message}`);
	}
}

/**
 * Reads a chapter from a specific book and translation.
 * Example URL: https://bible-api.deno.dev/api/read/rv1960/juan/3
 */
export async function readChapter(
	bookSlug: string,
	chapter: number,
	translation: string = DEFAULT_TRANSLATION,
	fetchFn: typeof fetch = fetch
): Promise<BibleVerse[]> {
	if (!bookSlug || bookSlug.trim() === '') {
		throw new BibleApiError('Book slug must be specified.');
	}
	if (chapter <= 0) {
		throw new BibleApiError('Chapter number must be greater than 0.');
	}

	const cleanSlug = encodeURIComponent(bookSlug.trim().toLowerCase());
	const url = `${BASE_URL}/read/${translation}/${cleanSlug}/${chapter}`;

	try {
		const res = await fetchFn(url);
		if (!res.ok) {
			throw new BibleApiError(`Failed to fetch chapter ${chapter} for ${bookSlug}: ${res.statusText}`, res.status);
		}
		const data = await res.json();
		return Array.isArray(data) ? data : data.verses || [data];
	} catch (error) {
		if (error instanceof BibleApiError) throw error;
		throw new BibleApiError(`Network error reading chapter ${chapter} for ${bookSlug}: ${(error as Error).message}`);
	}
}

/**
 * Reads a single verse from a specific book, chapter, and translation.
 * Example URL: https://bible-api.deno.dev/api/read/rv1960/juan/3/16
 */
export async function readVerse(
	bookSlug: string,
	chapter: number,
	verse: number,
	translation: string = DEFAULT_TRANSLATION,
	fetchFn: typeof fetch = fetch
): Promise<BibleVerse> {
	if (verse <= 0) {
		throw new BibleApiError('Verse number must be greater than 0.');
	}

	const cleanSlug = encodeURIComponent(bookSlug.trim().toLowerCase());
	const url = `${BASE_URL}/read/${translation}/${cleanSlug}/${chapter}/${verse}`;

	try {
		const res = await fetchFn(url);
		if (!res.ok) {
			throw new BibleApiError(`Failed to fetch verse ${chapter}:${verse} for ${bookSlug}: ${res.statusText}`, res.status);
		}
		return await res.json();
	} catch (error) {
		if (error instanceof BibleApiError) throw error;
		throw new BibleApiError(`Network error reading verse ${chapter}:${verse} for ${bookSlug}: ${(error as Error).message}`);
	}
}
