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

const BASE_URL = 'https://api.midvash.com/v1';
const DEFAULT_TRANSLATION = 'rvr1960';

/** The midvash API expects English book slugs. */
const SLUG_ES_TO_EN: Record<string, string> = {
	genesis: 'genesis', exodo: 'exodus', exo: 'exodus',
	levitico: 'leviticus', numeros: 'numbers', deuteronomio: 'deuteronomy',
	josue: 'joshua', jueces: 'judges', rut: 'ruth',
	'1-samuel': '1-samuel', '2-samuel': '2-samuel',
	'1-reyes': '1-kings', '2-reyes': '2-kings',
	'1-cronicas': '1-chronicles', '2-cronicas': '2-chronicles',
	esdras: 'ezra', nehemias: 'nehemiah', ester: 'esther',
	job: 'job', salmos: 'psalms', salmo: 'psalms',
	proverbios: 'proverbs', eclesiastes: 'ecclesiastes',
	cantares: 'song-of-solomon', isaias: 'isaiah', jeremias: 'jeremiah',
	lamentaciones: 'lamentations', ezequiel: 'ezekiel', daniel: 'daniel',
	oseas: 'hosea', joel: 'joel', amos: 'amos', abdias: 'obadiah',
	jonas: 'jonah', miqueas: 'micah', nahum: 'nahum', habacuc: 'habakkuk',
	sofonias: 'zephaniah', hageo: 'haggai', zacarias: 'zechariah',
	malaquias: 'malachi', mateo: 'matthew', marcos: 'mark',
	lucas: 'luke', juan: 'john', hechos: 'acts', romanos: 'romans',
	'1-corintios': '1-corinthians', '2-corintios': '2-corinthians',
	galatas: 'galatians', efesios: 'ephesians', filipenses: 'philippians',
	colosenses: 'colossians', '1-tesalonicenses': '1-thessalonians',
	'2-tesalonicenses': '2-thessalonians', '1-timoteo': '1-timothy',
	'2-timoteo': '2-timothy', tito: 'titus', filemon: 'philemon',
	hebreos: 'hebrews', santiago: 'james', '1-pedro': '1-peter',
	'2-pedro': '2-peter', '1-juan': '1-john', '2-juan': '2-john',
	'3-juan': '3-john', judas: 'jude', apocalipsis: 'revelation',
};

const TRANSLATION_ALIASES: Record<string, string> = { rv1960: 'rvr1960' };

function normalizeSlug(slug: string): string {
	const key = slug.trim().toLowerCase();
	return SLUG_ES_TO_EN[key] ?? key;
}

function normalizeTranslation(translation: string): string {
	return TRANSLATION_ALIASES[translation.toLowerCase()] ?? translation.toLowerCase();
}

/**
 * Fetches all available books of the Bible.
 */
export async function getBooks(fetchFn: typeof fetch = fetch): Promise<BibleBook[]> {
	try {
		const res = await fetchFn(`${BASE_URL}/books?language=es&version=rvr1960`);
		if (!res.ok) {
			throw new BibleApiError(`Failed to fetch Bible books: ${res.statusText}`, res.status);
		}
		const raw = await res.json();
		const list: any[] = Array.isArray(raw) ? raw : (raw.data || []);

		return list.map((b) => {
			const esName = typeof b.name === 'object' ? (b.name.es || b.name.en || '') : String(b.name || '');
			const enName = typeof b.name === 'object' ? (b.name.en || esName) : esName;
			const esSlug = typeof b.slug === 'object' ? (b.slug.es || b.slug.en || '') : String(b.slug || '');

			return {
				names: b.names ? b.names : [esName, enName].filter(Boolean),
				slug: esSlug,
				chapters: b.chapters
			};
		});
	} catch (error) {
		if (error instanceof BibleApiError) throw error;
		throw new BibleApiError(`Network error fetching Bible books: ${(error as Error).message}`);
	}
}

/**
 * Reads a chapter from a specific book and translation.
 * Example URL: https://api.midvash.com/v1/rvr1960/john/3
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

	const cleanSlug = normalizeSlug(bookSlug);
	const apiTranslation = normalizeTranslation(translation);
	const url = `${BASE_URL}/${apiTranslation}/${cleanSlug}/${chapter}`;

	try {
		const res = await fetchFn(url);
		if (!res.ok) {
			throw new BibleApiError(`Failed to fetch chapter ${chapter} for ${bookSlug}: ${res.statusText}`, res.status);
		}
		const raw = await res.json();
		const payload = raw.data || raw;

		let versesRaw = payload.verses || (Array.isArray(payload) ? payload : [payload]);

		if (Array.isArray(versesRaw)) {
			return versesRaw.map((v: any, idx: number) => {
				if (typeof v === 'string') {
					return { number: idx + 1, text: v };
				}
				return {
					number: v.number ?? v.verse ?? idx + 1,
					text: v.text || '',
					study: v.study,
					id: v.id
				};
			});
		}

		return [];
	} catch (error) {
		if (error instanceof BibleApiError) throw error;
		throw new BibleApiError(`Network error reading chapter ${chapter} for ${bookSlug}: ${(error as Error).message}`);
	}
}

/**
 * Reads a single verse from a specific book, chapter, and translation.
 * Example URL: https://api.midvash.com/v1/rvr1960/john/3/16
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

	const cleanSlug = normalizeSlug(bookSlug);
	const apiTranslation = normalizeTranslation(translation);
	const url = `${BASE_URL}/${apiTranslation}/${cleanSlug}/${chapter}/${verse}`;

	try {
		const res = await fetchFn(url);
		if (!res.ok) {
			throw new BibleApiError(`Failed to fetch verse ${chapter}:${verse} for ${bookSlug}: ${res.statusText}`, res.status);
		}
		const raw = await res.json();
		const payload = raw.data || raw;

		return {
			number: payload.verse || payload.number || verse,
			text: payload.text || (Array.isArray(payload.verses) ? payload.verses[0] : '')
		};
	} catch (error) {
		if (error instanceof BibleApiError) throw error;
		throw new BibleApiError(`Network error reading verse ${chapter}:${verse} for ${bookSlug}: ${(error as Error).message}`);
	}
}
