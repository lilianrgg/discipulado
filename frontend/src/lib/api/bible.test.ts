import { describe, it, expect, vi } from 'vitest';
import { getBooks, readChapter, readVerse, BibleApiError } from './bible';

describe('TypeScript Bible API Client', () => {
	it('should fetch list of books correctly', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => [{ names: ['Génesis'], slug: 'genesis', chapters: 50 }]
		});

		const books = await getBooks(mockFetch as any);
		expect(books).toHaveLength(1);
		expect(books[0].slug).toBe('genesis');
		expect(mockFetch).toHaveBeenCalledWith('https://api.midvash.com/v1/books?language=es&version=rvr1960');
	});

	it('should parse midvash real API JSON response structure correctly', async () => {
		const mockFetchBooks = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				data: [
					{
						id: 1,
						name: { es: 'Génesis', en: 'Genesis' },
						slug: { es: 'genesis', en: 'genesis' },
						chapters: 50
					}
				],
				meta: { total: 1 }
			})
		});
		const books = await getBooks(mockFetchBooks as any);
		expect(books).toHaveLength(1);
		expect(books[0].names[0]).toBe('Génesis');
		expect(books[0].slug).toBe('genesis');

		const mockFetchChapter = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				data: {
					version: 'rvr1960',
					book: 'john',
					chapter: 3,
					verses: ['Versículo 1 text', 'Versículo 2 text']
				},
				meta: { total: 2 }
			})
		});
		const verses = await readChapter('juan', 3, 'rvr1960', mockFetchChapter as any);
		expect(verses).toHaveLength(2);
		expect(verses[0].number).toBe(1);
		expect(verses[0].text).toBe('Versículo 1 text');
		expect(verses[1].number).toBe(2);
	});

	it('should throw BibleApiError on invalid input or HTTP error', async () => {
		await expect(readChapter('', 1)).rejects.toThrow(BibleApiError);
		await expect(readChapter('juan', 0)).rejects.toThrow(BibleApiError);

		const mockErrorFetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 404,
			statusText: 'Not Found'
		});

		await expect(getBooks(mockErrorFetch as any)).rejects.toThrow(BibleApiError);
	});
});
