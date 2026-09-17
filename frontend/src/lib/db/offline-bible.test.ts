import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBooks, readChapter } from '../api/bible';
import * as offlineDb from './offline-bible';

describe('Offline Bible Storage & Fallback Integration', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('should return cached books when network fetch fails (offline mode)', async () => {
		const mockCachedBooks = [
			{ names: ['Génesis'], slug: 'genesis', chapters: 50 }
		];
		vi.spyOn(offlineDb, 'getCachedBooks').mockResolvedValue(mockCachedBooks);

		const mockFailedFetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

		const books = await getBooks(mockFailedFetch as any);
		expect(books).toEqual(mockCachedBooks);
	});

	it('should return cached chapter verses when network fetch fails (offline mode)', async () => {
		const mockCachedVerses = [
			{ number: 1, text: 'En el principio creó Dios los cielos y la tierra.' }
		];
		vi.spyOn(offlineDb, 'getCachedChapter').mockResolvedValue(mockCachedVerses);

		const mockFailedFetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

		const verses = await readChapter('genesis', 1, 'rvr1960', mockFailedFetch as any);
		expect(verses).toEqual(mockCachedVerses);
	});

	it('should save fetched chapter verses to IndexedDB cache on successful network fetch', async () => {
		const spySetCache = vi.spyOn(offlineDb, 'setCachedChapter').mockResolvedValue();

		const mockSuccessFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				data: {
					verses: ['En el principio creó Dios los cielos y la tierra.']
				}
			})
		});

		const verses = await readChapter('genesis', 1, 'rvr1960', mockSuccessFetch as any);
		expect(verses).toHaveLength(1);
		expect(spySetCache).toHaveBeenCalledWith(
			'genesis',
			1,
			[{ number: 1, text: 'En el principio creó Dios los cielos y la tierra.' }],
			'rvr1960'
		);
	});
});
