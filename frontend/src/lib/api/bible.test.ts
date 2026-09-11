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
		expect(mockFetch).toHaveBeenCalledWith('https://bible-api.deno.dev/api/books');
	});

	it('should construct correct URL for reading a chapter', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => [{ number: 1, text: 'En el principio...' }]
		});

		const verses = await readChapter('juan', 3, 'rv1960', mockFetch as any);
		expect(verses).toHaveLength(1);
		expect(mockFetch).toHaveBeenCalledWith('https://bible-api.deno.dev/api/read/rv1960/juan/3');
	});

	it('should construct correct URL for reading a single verse', async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ number: 16, text: 'Porque de tal manera amó Dios al mundo...' })
		});

		const verse = await readVerse('juan', 3, 16, 'rv1960', mockFetch as any);
		expect(verse.number).toBe(16);
		expect(mockFetch).toHaveBeenCalledWith('https://bible-api.deno.dev/api/read/rv1960/juan/3/16');
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
