<script lang="ts">
	import { goto } from '$app/navigation';
	import { parseReference, searchVerses, type SearchResultItem } from '$lib/search/bible-search';
	import { getAllCachedChapters } from '$lib/db/offline-bible';
	import { readChapter, getBooks, type BibleBook } from '$lib/api/bible';

	let query = $state('');
	let searching = $state(false);
	let results = $state<SearchResultItem[]>([]);
	let searchedQuery = $state('');

	let parsedRef = $derived(parseReference(query));

	// Reactive auto-search on typing (250ms debounce)
	$effect(() => {
		const currentQuery = query.trim();
		if (!currentQuery) {
			results = [];
			searchedQuery = '';
			return;
		}

		const timer = setTimeout(() => {
			performSearch();
		}, 250);

		return () => clearTimeout(timer);
	});

	// Primary search trigger
	async function performSearch() {
		const trimmed = query.trim();
		if (!trimmed) {
			results = [];
			searchedQuery = '';
			return;
		}

		searching = true;
		searchedQuery = trimmed;
		results = [];

		try {
			const allBooks = await getBooks().catch(() => [] as BibleBook[]);

			// 1. If search is a passage reference (e.g. "Juan 3:16" or "Juan 3")
			if (parsedRef.isReference && parsedRef.bookSlug && parsedRef.chapter) {
				const bookMeta = allBooks.find((b) => b.slug === parsedRef.bookSlug);
				const bookName = bookMeta?.names[0] ?? parsedRef.bookName ?? parsedRef.bookSlug;

				const chapterVerses = await readChapter(parsedRef.bookSlug, parsedRef.chapter).catch(() => []);

				if (chapterVerses && chapterVerses.length > 0) {
					// Filter for exact verse if specified, otherwise include all verses of chapter
					const targetVerses = parsedRef.verse
						? chapterVerses.filter((v) => Number(v.number) === Number(parsedRef.verse))
						: chapterVerses;

					results = targetVerses.map((v) => ({
						bookSlug: parsedRef.bookSlug!,
						bookName,
						chapter: parsedRef.chapter!,
						verseNumber: Number(v.number),
						text: v.text,
						highlightedHtml: v.text
					}));
				}
				return;
			}

			if (trimmed.length < 2) return;

			// 2. Keyword search over local IndexedDB cached chapters + sample chapters
			const cachedEntries = await getAllCachedChapters();
			const searchPool: Array<{ bookSlug: string; bookName: string; chapter: number; verses: any[] }> = [];
			const loadedKeys = new Set<string>();

			for (const entry of cachedEntries) {
				searchPool.push({
					bookSlug: entry.bookSlug,
					bookName: entry.bookSlug.toUpperCase(),
					chapter: entry.chapter,
					verses: entry.verses
				});
				loadedKeys.add(`${entry.bookSlug}:${entry.chapter}`);
			}

			// Update book names in search pool
			for (const item of searchPool) {
				const meta = allBooks.find((b) => b.slug === item.bookSlug);
				if (meta && meta.names.length > 0) {
					item.bookName = meta.names[0];
				}
			}

			// If pool is small, fetch sample chapters (e.g. Genesis 1, Juan 1, Juan 3, Salmos 23, Mateo 5, Romanos 8)
			const popularTargets = [
				{ slug: 'genesis', ch: 1 },
				{ slug: 'juan', ch: 1 },
				{ slug: 'juan', ch: 3 },
				{ slug: 'salmos', ch: 23 },
				{ slug: 'mateo', ch: 5 },
				{ slug: 'romanos', ch: 8 }
			];

			for (const target of popularTargets) {
				const key = `${target.slug}:${target.ch}`;
				if (!loadedKeys.has(key)) {
					const verses = await readChapter(target.slug, target.ch).catch(() => []);
					if (verses && verses.length > 0) {
						const meta = allBooks.find((b) => b.slug === target.slug);
						searchPool.push({
							bookSlug: target.slug,
							bookName: meta?.names[0] ?? target.slug,
							chapter: target.ch,
							verses
						});
						loadedKeys.add(key);
					}
				}
			}

			// Perform keyword matching over loaded chapters
			results = searchVerses(trimmed, searchPool);
		} finally {
			searching = false;
		}
	}

	function goToRef() {
		if (parsedRef.isReference && parsedRef.bookSlug && parsedRef.chapter) {
			const targetUrl = parsedRef.verse
				? `/${parsedRef.bookSlug}/${parsedRef.chapter}#v${parsedRef.verse}`
				: `/${parsedRef.bookSlug}/${parsedRef.chapter}`;
			goto(targetUrl);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			performSearch();
		}
	}
</script>

<svelte:head>
	<title>Búsqueda — Biblia RVR1960</title>
</svelte:head>

<nav class="top-bar__breadcrumb" aria-label="Ubicación actual" style="margin-bottom: var(--sp-6);">
	<a href="/">Inicio</a>
	<span aria-hidden="true">›</span>
	<span>Búsqueda</span>
</nav>

<h1 class="section-title">Buscador Bíblico RVR1960</h1>

<div class="search-bar" style="display:flex;gap:var(--sp-2);">
	<div style="position:relative;flex:1;">
		<svg
			class="search-bar__icon"
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
		<input
			id="search-input"
			type="search"
			placeholder="Ej: Juan 3:16 o 'amor', 'luz', 'gracia'..."
			bind:value={query}
			onkeydown={handleKeydown}
			aria-label="Buscar pasaje o palabra clave"
		/>
	</div>
	<button
		type="button"
		class="chapter-nav__btn"
		onclick={performSearch}
		style="padding:var(--sp-2) var(--sp-5);background:var(--clr-accent);color:#fff;border:none;cursor:pointer;border-radius:var(--r-full);font-weight:600;"
	>
		Buscar
	</button>
</div>

{#if searching}
	<div class="state-loading" aria-live="polite" aria-busy="true">
		<div class="spinner" role="status" aria-label="Buscando..."></div>
		<span>Buscando en las Escrituras...</span>
	</div>
{:else if results.length > 0}
 <div
	class="verse-list"
	style="margin-bottom:var(--sp-6);padding:var(--sp-4);background:var(--clr-surface);border:1px solid var(--clr-accent);border-radius:var(--r-md);display:flex;align-items:center;justify-content:space-between;"
  >
	<h2 class="section-subtitle">{results.length} resultado(s) para «{searchedQuery}»</h2>
	
	<div class="verse-list" aria-label="Resultados de búsqueda">
		{#each results as item (item.bookSlug + item.chapter + item.verseNumber)}
			<a
				href="/{item.bookSlug}/{item.chapter}#v{item.verseNumber}"
				class="verse-item"
				style="text-decoration:none;display:block;"
			>
				<span class="verse-num" style="display:inline-block;margin-bottom:var(--sp-1);">{item.bookName} {item.chapter}:{item.verseNumber}</span>
				<p class="verse-text">{@html item.highlightedHtml}</p>
			</a>
		{/each}
	</div>
</div>
	
{:else if searchedQuery}
	<div class="state-error" style="background:var(--clr-surface);border-color:var(--clr-border);color:var(--clr-text-muted);">
		No se encontraron coincidencias para «{searchedQuery}». Intenta buscar otro término o pasaje como <strong>Juan 3:16</strong> o <strong>Salmos 23</strong>.
	</div>
{/if}
