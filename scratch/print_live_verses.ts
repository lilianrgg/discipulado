import { parseReference } from '../frontend/src/lib/search/bible-search';
import { readChapter } from '../frontend/src/lib/api/bible';

const testReferences = [
	{ query: 'Génesis 1:1', slug: 'genesis', ch: 1, v: 1 },
	{ query: 'Éxodo 20:3', slug: 'exodo', ch: 20, v: 3 },
	{ query: 'Salmos 23:1', slug: 'salmos', ch: 23, v: 1 },
	{ query: 'Proverbios 3:5', slug: 'proverbios', ch: 3, v: 5 },
	{ query: 'Mateo 5:3', slug: 'mateo', ch: 5, v: 3 },
	{ query: 'Juan 3:16', slug: 'juan', ch: 3, v: 16 },
	{ query: 'Romanos 8:28', slug: 'romanos', ch: 8, v: 28 },
	{ query: '1 Corintios 13:4', slug: '1-corintios', ch: 13, v: 4 },
	{ query: '1 Juan 4:8', slug: '1-juan', ch: 4, v: 8 },
	{ query: 'Apocalipsis 22:21', slug: 'apocalipsis', ch: 22, v: 21 }
];

async function run() {
	console.log('=== LIVE API FETCH RESULTS ===');
	for (const item of testReferences) {
		const parsed = parseReference(item.query);
		const chapterVerses = await readChapter(parsed.bookSlug!, parsed.chapter!);
		const matchingVerse = chapterVerses.find((v) => Number(v.number) === Number(parsed.verse));
		console.log(`PASSAGE: ${item.query} [Slug: ${parsed.bookSlug}] -> Verse ${matchingVerse?.number}: "${matchingVerse?.text}"`);
	}
}

run();
