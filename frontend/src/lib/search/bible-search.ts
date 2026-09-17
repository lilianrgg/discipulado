import type { BibleVerse } from '$lib/api/bible';

export interface SearchResultItem {
	bookSlug: string;
	bookName: string;
	chapter: number;
	verseNumber: number;
	text: string;
	highlightedHtml: string;
}

export interface ParsedReference {
	isReference: boolean;
	bookSlug?: string;
	bookName?: string;
	chapter?: number;
	verse?: number;
}

const BOOK_ALIAS_MAP: Record<string, { slug: string; name: string }> = {
	gn: { slug: 'genesis', name: 'Génesis' },
	genesis: { slug: 'genesis', name: 'Génesis' },
	ex: { slug: 'exodus', name: 'Éxodo' },
	exodo: { slug: 'exodus', name: 'Éxodo' },
	lev: { slug: 'leviticus', name: 'Levítico' },
	levitico: { slug: 'leviticus', name: 'Levítico' },
	num: { slug: 'numbers', name: 'Números' },
	numeros: { slug: 'numbers', name: 'Números' },
	dt: { slug: 'deuteronomy', name: 'Deuteronomio' },
	deuteronomio: { slug: 'deuteronomy', name: 'Deuteronomio' },
	jos: { slug: 'joshua', name: 'Josué' },
	josue: { slug: 'joshua', name: 'Josué' },
	jue: { slug: 'judges', name: 'Jueces' },
	jueces: { slug: 'judges', name: 'Jueces' },
	rt: { slug: 'ruth', name: 'Rut' },
	rut: { slug: 'ruth', name: 'Rut' },
	'1sam': { slug: '1-samuel', name: '1 Samuel' },
	'1 sam': { slug: '1-samuel', name: '1 Samuel' },
	'1 samuel': { slug: '1-samuel', name: '1 Samuel' },
	'2sam': { slug: '2-samuel', name: '2 Samuel' },
	'2 sam': { slug: '2-samuel', name: '2 Samuel' },
	'2 samuel': { slug: '2-samuel', name: '2 Samuel' },
	'1rey': { slug: '1-kings', name: '1 Reyes' },
	'1 rey': { slug: '1-kings', name: '1 Reyes' },
	'1 reyes': { slug: '1-kings', name: '1 Reyes' },
	'2rey': { slug: '2-kings', name: '2 Reyes' },
	'2 rey': { slug: '2-kings', name: '2 Reyes' },
	'2 reyes': { slug: '2-kings', name: '2 Reyes' },
	job: { slug: 'job', name: 'Job' },
	sal: { slug: 'psalms', name: 'Salmos' },
	salmo: { slug: 'psalms', name: 'Salmos' },
	salmos: { slug: 'psalms', name: 'Salmos' },
	pr: { slug: 'proverbs', name: 'Proverbios' },
	proverbios: { slug: 'proverbs', name: 'Proverbios' },
	ec: { slug: 'ecclesiastes', name: 'Eclesiastés' },
	eclesiastes: { slug: 'ecclesiastes', name: 'Eclesiastés' },
	is: { slug: 'isaiah', name: 'Isaías' },
	isaias: { slug: 'isaiah', name: 'Isaías' },
	jer: { slug: 'jeremiah', name: 'Jeremías' },
	jeremias: { slug: 'jeremiah', name: 'Jeremías' },
	mt: { slug: 'matthew', name: 'Mateo' },
	mateo: { slug: 'matthew', name: 'Mateo' },
	mc: { slug: 'mark', name: 'Marcos' },
	marcos: { slug: 'mark', name: 'Marcos' },
	lc: { slug: 'luke', name: 'Lucas' },
	lucas: { slug: 'luke', name: 'Lucas' },
	jn: { slug: 'john', name: 'Juan' },
	juan: { slug: 'john', name: 'Juan' },
	hch: { slug: 'acts', name: 'Hechos' },
	hechos: { slug: 'acts', name: 'Hechos' },
	ro: { slug: 'romans', name: 'Romanos' },
	romanos: { slug: 'romans', name: 'Romanos' },
	'1cor': { slug: '1-corinthians', name: '1 Corintios' },
	'1 cor': { slug: '1-corinthians', name: '1 Corintios' },
	'1 corintios': { slug: '1-corinthians', name: '1 Corintios' },
	'2cor': { slug: '2-corinthians', name: '2 Corintios' },
	'2 cor': { slug: '2-corinthians', name: '2 Corintios' },
	'2 corintios': { slug: '2-corinthians', name: '2 Corintios' },
	gl: { slug: 'galatians', name: 'Gálatas' },
	galatas: { slug: 'galatians', name: 'Gálatas' },
	ef: { slug: 'ephesians', name: 'Efesios' },
	efesios: { slug: 'ephesians', name: 'Efesios' },
	flp: { slug: 'philippians', name: 'Filipenses' },
	filipenses: { slug: 'philippians', name: 'Filipenses' },
	col: { slug: 'colossians', name: 'Colosenses' },
	colosenses: { slug: 'colossians', name: 'Colosenses' },
	'1jn': { slug: '1-john', name: '1 Juan' },
	'1 jn': { slug: '1-john', name: '1 Juan' },
	'1 juan': { slug: '1-juan', name: '1 Juan' },
	'2jn': { slug: '2-john', name: '2 Juan' },
	'2 jn': { slug: '2-john', name: '2 Juan' },
	'2 juan': { slug: '2-john', name: '2 Juan' },
	'3jn': { slug: '3-john', name: '3 Juan' },
	'3 jn': { slug: '3-john', name: '3 Juan' },
	'3 juan': { slug: '3-john', name: '3 Juan' },
	ap: { slug: 'revelation', name: 'Apocalipsis' },
	apocalipsis: { slug: 'revelation', name: 'Apocalipsis' }
};

/** Normalizes text removing diacritics / accents for accent-insensitive matching */
export function normalizeText(str: string): string {
	return str
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

/** Parses search query for passage references like "Juan 3:16" or "1 Jn 4:8" */
export function parseReference(query: string): ParsedReference {
	const trimmed = query.trim();
	const refRegex = /^([1-3]?\s*[a-zA-záéíóúñÁÉÍÓÚÑ]+)\s+(\d+)(?::(\d+))?$/i;
	const match = trimmed.match(refRegex);

	if (!match) {
		return { isReference: false };
	}

	const rawBook = normalizeText(match[1]);
	const chapter = parseInt(match[2], 10);
	const verse = match[3] ? parseInt(match[3], 10) : undefined;

	const mapped = BOOK_ALIAS_MAP[rawBook];
	if (mapped) {
		return {
			isReference: true,
			bookSlug: mapped.slug,
			bookName: mapped.name,
			chapter,
			verse
		};
	}

	return { isReference: false };
}

/** Highlights keyword occurrences within verse text */
export function highlightText(text: string, query: string): string {
	if (!query.trim()) return text;
	const normalizedQuery = normalizeText(query);
	const normalizedText = normalizeText(text);

	const index = normalizedText.indexOf(normalizedQuery);
	if (index === -1) return text;

	// Extract match span with original casing preserved
	const matchedStr = text.slice(index, index + query.length);
	const before = text.slice(0, index);
	const after = text.slice(index + query.length);

	return `${before}<mark class="search-highlight">${matchedStr}</mark>${after}`;
}

/** Client-side search across a collection of verse records */
export function searchVerses(
	query: string,
	chapters: Array<{ bookSlug: string; bookName: string; chapter: number; verses: BibleVerse[] }>
): SearchResultItem[] {
	if (!query || query.trim().length < 2) return [];

	const normalizedQuery = normalizeText(query);
	const results: SearchResultItem[] = [];

	for (const item of chapters) {
		for (const verse of item.verses) {
			const normalizedVerseText = normalizeText(verse.text);
			if (normalizedVerseText.includes(normalizedQuery)) {
				results.push({
					bookSlug: item.bookSlug,
					bookName: item.bookName,
					chapter: item.chapter,
					verseNumber: verse.number,
					text: verse.text,
					highlightedHtml: highlightText(verse.text, query)
				});
			}
		}
	}

	return results;
}
