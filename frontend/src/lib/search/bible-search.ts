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
	gen: { slug: 'genesis', name: 'Génesis' },
	genesis: { slug: 'genesis', name: 'Génesis' },
	ex: { slug: 'exodo', name: 'Éxodo' },
	exo: { slug: 'exodo', name: 'Éxodo' },
	exod: { slug: 'exodo', name: 'Éxodo' },
	exodo: { slug: 'exodo', name: 'Éxodo' },
	lev: { slug: 'levitico', name: 'Levítico' },
	levit: { slug: 'levitico', name: 'Levítico' },
	levitico: { slug: 'levitico', name: 'Levítico' },
	num: { slug: 'numeros', name: 'Números' },
	nume: { slug: 'numeros', name: 'Números' },
	numeros: { slug: 'numeros', name: 'Números' },
	dt: { slug: 'deuteronomio', name: 'Deuteronomio' },
	deut: { slug: 'deuteronomio', name: 'Deuteronomio' },
	deuteronomio: { slug: 'deuteronomio', name: 'Deuteronomio' },
	jos: { slug: 'josue', name: 'Josué' },
	josu: { slug: 'josue', name: 'Josué' },
	josue: { slug: 'josue', name: 'Josué' },
	jue: { slug: 'jueces', name: 'Jueces' },
	juec: { slug: 'jueces', name: 'Jueces' },
	jueces: { slug: 'jueces', name: 'Jueces' },
	rt: { slug: 'rut', name: 'Rut' },
	rut: { slug: 'rut', name: 'Rut' },
	'1sam': { slug: '1-samuel', name: '1 Samuel' },
	'1 sam': { slug: '1-samuel', name: '1 Samuel' },
	'1 samuel': { slug: '1-samuel', name: '1 Samuel' },
	'2sam': { slug: '2-samuel', name: '2 Samuel' },
	'2 sam': { slug: '2-samuel', name: '2 Samuel' },
	'2 samuel': { slug: '2-samuel', name: '2 Samuel' },
	'1rey': { slug: '1-reyes', name: '1 Reyes' },
	'1 rey': { slug: '1-reyes', name: '1 Reyes' },
	'1 reyes': { slug: '1-reyes', name: '1 Reyes' },
	'2rey': { slug: '2-reyes', name: '2 Reyes' },
	'2 rey': { slug: '2-reyes', name: '2 Reyes' },
	'2 reyes': { slug: '2-reyes', name: '2 Reyes' },
	'1cro': { slug: '1-cronicas', name: '1 Crónicas' },
	'1 cro': { slug: '1-cronicas', name: '1 Crónicas' },
	'1 cron': { slug: '1-cronicas', name: '1 Crónicas' },
	'1 cronicas': { slug: '1-cronicas', name: '1 Crónicas' },
	'2cro': { slug: '2-cronicas', name: '2 Crónicas' },
	'2 cro': { slug: '2-cronicas', name: '2 Crónicas' },
	'2 cron': { slug: '2-cronicas', name: '2 Crónicas' },
	'2 cronicas': { slug: '2-cronicas', name: '2 Crónicas' },
	esd: { slug: 'esdras', name: 'Esdras' },
	esdras: { slug: 'esdras', name: 'Esdras' },
	neh: { slug: 'nehemias', name: 'Nehemías' },
	nehem: { slug: 'nehemias', name: 'Nehemías' },
	nehemias: { slug: 'nehemias', name: 'Nehemías' },
	est: { slug: 'ester', name: 'Ester' },
	este: { slug: 'ester', name: 'Ester' },
	ester: { slug: 'ester', name: 'Ester' },
	job: { slug: 'job', name: 'Job' },
	sal: { slug: 'salmos', name: 'Salmos' },
	salm: { slug: 'salmos', name: 'Salmos' },
	salmo: { slug: 'salmos', name: 'Salmos' },
	salmos: { slug: 'salmos', name: 'Salmos' },
	pr: { slug: 'proverbios', name: 'Proverbios' },
	pro: { slug: 'proverbios', name: 'Proverbios' },
	prov: { slug: 'proverbios', name: 'Proverbios' },
	proverbios: { slug: 'proverbios', name: 'Proverbios' },
	ec: { slug: 'eclesiastes', name: 'Eclesiastés' },
	ecl: { slug: 'eclesiastes', name: 'Eclesiastés' },
	ecle: { slug: 'eclesiastes', name: 'Eclesiastés' },
	eclesiastes: { slug: 'eclesiastes', name: 'Eclesiastés' },
	cnt: { slug: 'cantares', name: 'Cantares' },
	cantar: { slug: 'cantares', name: 'Cantares' },
	cantares: { slug: 'cantares', name: 'Cantares' },
	is: { slug: 'isaias', name: 'Isaías' },
	isai: { slug: 'isaias', name: 'Isaías' },
	isaias: { slug: 'isaias', name: 'Isaías' },
	jer: { slug: 'jeremias', name: 'Jeremías' },
	jere: { slug: 'jeremias', name: 'Jeremías' },
	jeremias: { slug: 'jeremias', name: 'Jeremías' },
	lam: { slug: 'lamentaciones', name: 'Lamentaciones' },
	lament: { slug: 'lamentaciones', name: 'Lamentaciones' },
	lamentaciones: { slug: 'lamentaciones', name: 'Lamentaciones' },
	ez: { slug: 'ezequiel', name: 'Ezequiel' },
	ezeq: { slug: 'ezequiel', name: 'Ezequiel' },
	ezequiel: { slug: 'ezequiel', name: 'Ezequiel' },
	dn: { slug: 'daniel', name: 'Daniel' },
	dan: { slug: 'daniel', name: 'Daniel' },
	daniel: { slug: 'daniel', name: 'Daniel' },
	os: { slug: 'oseas', name: 'Oseas' },
	ose: { slug: 'oseas', name: 'Oseas' },
	oseas: { slug: 'oseas', name: 'Oseas' },
	joel: { slug: 'joel', name: 'Joel' },
	am: { slug: 'amos', name: 'Amós' },
	amos: { slug: 'amos', name: 'Amós' },
	ab: { slug: 'abdias', name: 'Abdías' },
	abd: { slug: 'abdias', name: 'Abdías' },
	abdias: { slug: 'abdias', name: 'Abdías' },
	jon: { slug: 'jonas', name: 'Jonás' },
	jonas: { slug: 'jonas', name: 'Jonás' },
	miq: { slug: 'miqueas', name: 'Miqueas' },
	miqueas: { slug: 'miqueas', name: 'Miqueas' },
	nah: { slug: 'nahum', name: 'Nahúm' },
	nahum: { slug: 'nahum', name: 'Nahúm' },
	hab: { slug: 'habacuc', name: 'Habacuc' },
	habacuc: { slug: 'habacuc', name: 'Habacuc' },
	sof: { slug: 'sofonias', name: 'Sofonías' },
	sofonias: { slug: 'sofonias', name: 'Sofonías' },
	hag: { slug: 'hageo', name: 'Hageo' },
	hageo: { slug: 'hageo', name: 'Hageo' },
	zac: { slug: 'zacarias', name: 'Zacarías' },
	zacarias: { slug: 'zacarias', name: 'Zacarías' },
	mal: { slug: 'malaquias', name: 'Malaquías' },
	malaquias: { slug: 'malaquias', name: 'Malaquías' },
	mt: { slug: 'mateo', name: 'Mateo' },
	mat: { slug: 'mateo', name: 'Mateo' },
	mateo: { slug: 'mateo', name: 'Mateo' },
	mc: { slug: 'marcos', name: 'Marcos' },
	mr: { slug: 'marcos', name: 'Marcos' },
	mar: { slug: 'marcos', name: 'Marcos' },
	marcos: { slug: 'marcos', name: 'Marcos' },
	lc: { slug: 'lucas', name: 'Lucas' },
	luc: { slug: 'lucas', name: 'Lucas' },
	lucas: { slug: 'lucas', name: 'Lucas' },
	jn: { slug: 'juan', name: 'Juan' },
	juan: { slug: 'juan', name: 'Juan' },
	hch: { slug: 'hechos', name: 'Hechos' },
	hec: { slug: 'hechos', name: 'Hechos' },
	hechos: { slug: 'hechos', name: 'Hechos' },
	ro: { slug: 'romanos', name: 'Romanos' },
	rom: { slug: 'romanos', name: 'Romanos' },
	romanos: { slug: 'romanos', name: 'Romanos' },
	'1cor': { slug: '1-corintios', name: '1 Corintios' },
	'1 cor': { slug: '1-corintios', name: '1 Corintios' },
	'1 corintios': { slug: '1-corintios', name: '1 Corintios' },
	'2cor': { slug: '2-corintios', name: '2 Corintios' },
	'2 cor': { slug: '2-corintios', name: '2 Corintios' },
	'2 corintios': { slug: '2-corintios', name: '2 Corintios' },
	gl: { slug: 'galatas', name: 'Gálatas' },
	gal: { slug: 'galatas', name: 'Gálatas' },
	galatas: { slug: 'galatas', name: 'Gálatas' },
	ef: { slug: 'efesios', name: 'Efesios' },
	efe: { slug: 'efesios', name: 'Efesios' },
	efesios: { slug: 'efesios', name: 'Efesios' },
	flp: { slug: 'filipenses', name: 'Filipenses' },
	fil: { slug: 'filipenses', name: 'Filipenses' },
	filipenses: { slug: 'filipenses', name: 'Filipenses' },
	col: { slug: 'colosenses', name: 'Colosenses' },
	colosenses: { slug: 'colosenses', name: 'Colosenses' },
	'1ts': { slug: '1-tesalonicenses', name: '1 Tesalonicenses' },
	'1 tes': { slug: '1-tesalonicenses', name: '1 Tesalonicenses' },
	'1 tesalonicenses': { slug: '1-tesalonicenses', name: '1 Tesalonicenses' },
	'2ts': { slug: '2-tesalonicenses', name: '2 Tesalonicenses' },
	'2 tes': { slug: '2-tesalonicenses', name: '2 Tesalonicenses' },
	'2 tesalonicenses': { slug: '2-tesalonicenses', name: '2 Tesalonicenses' },
	'1tm': { slug: '1-timoteo', name: '1 Timoteo' },
	'1 tim': { slug: '1-timoteo', name: '1 Timoteo' },
	'1 timoteo': { slug: '1-timoteo', name: '1 Timoteo' },
	'2tm': { slug: '2-timoteo', name: '2 Timoteo' },
	'2 tim': { slug: '2-timoteo', name: '2 Timoteo' },
	'2 timoteo': { slug: '2-timoteo', name: '2 Timoteo' },
	tit: { slug: 'tito', name: 'Tito' },
	tito: { slug: 'tito', name: 'Tito' },
	flm: { slug: 'filemon', name: 'Filemón' },
	filemon: { slug: 'filemon', name: 'Filemón' },
	heb: { slug: 'hebreos', name: 'Hebreos' },
	he: { slug: 'hebreos', name: 'Hebreos' },
	hebreos: { slug: 'hebreos', name: 'Hebreos' },
	stg: { slug: 'santiago', name: 'Santiago' },
	sant: { slug: 'santiago', name: 'Santiago' },
	santiago: { slug: 'santiago', name: 'Santiago' },
	'1pe': { slug: '1-pedro', name: '1 Pedro' },
	'1 pe': { slug: '1-pedro', name: '1 Pedro' },
	'1 ped': { slug: '1-pedro', name: '1 Pedro' },
	'1 pedro': { slug: '1-pedro', name: '1 Pedro' },
	'2pe': { slug: '2-pedro', name: '2 Pedro' },
	'2 pe': { slug: '2-pedro', name: '2 Pedro' },
	'2 ped': { slug: '2-pedro', name: '2 Pedro' },
	'2 pedro': { slug: '2-pedro', name: '2 Pedro' },
	'1jn': { slug: '1-juan', name: '1 Juan' },
	'1 jn': { slug: '1-juan', name: '1 Juan' },
	'1 juan': { slug: '1-juan', name: '1 Juan' },
	'2jn': { slug: '2-juan', name: '2 Juan' },
	'2 jn': { slug: '2-juan', name: '2 Juan' },
	'2 juan': { slug: '2-juan', name: '2 Juan' },
	'3jn': { slug: '3-juan', name: '3 Juan' },
	'3 jn': { slug: '3-juan', name: '3 Juan' },
	'3 juan': { slug: '3-juan', name: '3 Juan' },
	jud: { slug: 'judas', name: 'Judas' },
	judas: { slug: 'judas', name: 'Judas' },
	ap: { slug: 'apocalipsis', name: 'Apocalipsis' },
	apoc: { slug: 'apocalipsis', name: 'Apocalipsis' },
	apocalipsis: { slug: 'apocalipsis', name: 'Apocalipsis' }
};

/** Normalizes text removing diacritics / accents for accent-insensitive matching */
export function normalizeText(str: string): string {
	return str
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

/** Parses search query for passage references like "Juan 3:16", "1 Corintios 13:4", or "1 Jn 4.8" */
export function parseReference(query: string): ParsedReference {
	const trimmed = query.trim();
	const refRegex = /^([1-3]?\s*[a-zA-záéíóúñÁÉÍÓÚÑ]+(?:\s+[a-zA-záéíóúñÁÉÍÓÚÑ]+)*)\s+(\d+)(?:[:.,\s]+(\d+))?$/i;
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
