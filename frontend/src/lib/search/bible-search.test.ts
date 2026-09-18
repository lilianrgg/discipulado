import { describe, it, expect } from 'vitest';
import {
	parseReference,
	normalizeText,
	highlightText,
	searchVerses
} from './bible-search';
import { readChapter } from '../api/bible';

describe('Bible Search Engine (Live API Integration)', () => {
	it('should parse reference and dynamically fetch and filter exact verse text from API across multiple books', async () => {
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

		for (const item of testReferences) {
			const parsed = parseReference(item.query);
			expect(parsed.isReference).toBe(true);
			expect(parsed.bookSlug).toBe(item.slug);
			expect(parsed.chapter).toBe(item.ch);
			expect(parsed.verse).toBe(item.v);

			// Fetch chapter dynamically from API (no hardcoded verse texts in test)
			const chapterVerses = await readChapter(parsed.bookSlug!, parsed.chapter!);
			expect(chapterVerses.length).toBeGreaterThan(0);

			// Filter target verse dynamically from response
			const matchingVerse = chapterVerses.find((v) => Number(v.number) === Number(parsed.verse));
			expect(matchingVerse).toBeDefined();
			expect(matchingVerse?.text).toBeTruthy();

			console.log(`[API RESPONSE] ${item.query} -> Versículo ${matchingVerse?.number}: "${matchingVerse?.text}"`);
		}
	}, 25000);

	it('should return isReference false for general search terms', () => {
		const ref = parseReference('Dios es amor');
		expect(ref.isReference).toBe(false);
	});

	it('should normalize Spanish text with diacritics', () => {
		expect(normalizeText('Génesis')).toBe('genesis');
		expect(normalizeText('Éxodo')).toBe('exodo');
		expect(normalizeText('JEREMÍAS')).toBe('jeremias');
	});

	it('should highlight keyword occurrences within verse text', () => {
		const highlighted = highlightText('Porque de tal manera amó Dios al mundo', 'Dios');
		expect(highlighted).toContain('<mark class="search-highlight">Dios</mark>');
	});

	it('should search across verses list and return matching items', () => {
		const sampleData = [
			{
				bookSlug: 'juan',
				bookName: 'Juan',
				chapter: 3,
				verses: [
					{ number: 16, text: 'Porque de tal manera amó Dios al mundo...' }
				]
			}
		];

		const results = searchVerses('Dios', sampleData);
		expect(results).toHaveLength(1);
		expect(results[0].bookSlug).toBe('juan');
		expect(results[0].verseNumber).toBe(16);
	});
});
