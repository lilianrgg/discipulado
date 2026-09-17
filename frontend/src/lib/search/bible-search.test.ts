import { describe, it, expect } from 'vitest';
import {
	parseReference,
	normalizeText,
	highlightText,
	searchVerses
} from './bible-search';

describe('Bible Search Engine', () => {
	it('should parse valid passage references correctly', () => {
		const ref1 = parseReference('Juan 3:16');
		expect(ref1.isReference).toBe(true);
		expect(ref1.bookSlug).toBe('john');
		expect(ref1.chapter).toBe(3);
		expect(ref1.verse).toBe(16);

		const ref2 = parseReference('1 Jn 4');
		expect(ref2.isReference).toBe(true);
		expect(ref2.bookSlug).toBe('1-john');
		expect(ref2.chapter).toBe(4);
		expect(ref2.verse).toBeUndefined();
	});

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
				bookSlug: 'john',
				bookName: 'Juan',
				chapter: 3,
				verses: [
					{ number: 16, text: 'Porque de tal manera amó Dios al mundo...' }
				]
			}
		];

		const results = searchVerses('Dios', sampleData);
		expect(results).toHaveLength(1);
		expect(results[0].bookSlug).toBe('john');
		expect(results[0].verseNumber).toBe(16);
	});
});
