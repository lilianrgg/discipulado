<script lang="ts">
	import { goto } from '$app/navigation';
	import { parseReference, searchVerses, type SearchResultItem } from '$lib/search/bible-search';
	import { getCachedChapter } from '$lib/db/offline-bible';
	import { readChapter, getBooks, type BibleBook } from '$lib/api/bible';

	let query = $state('');
	let searching = $state(false);
	let results = $state<SearchResultItem[]>([]);
	let parsedRef = $derived(parseReference(query));

	async function performSearch() {
		const trimmed = query.trim();
		if (!trimmed) {
			results = [];
			return;
		}

		// If query is a direct reference like "Juan 3:16" or "Jn 3", handle direct jump
		if (parsedRef.isReference && parsedRef.bookSlug && parsedRef.chapter) {
			const targetUrl = parsedRef.verse
				? `/${parsedRef.bookSlug}/${parsedRef.chapter}#v${parsedRef.verse}`
				: `/${parsedRef.bookSlug}/${parsedRef.chapter}`;
			goto(targetUrl);
			return;
		}

		if (trimmed.length < 2) return;

		searching = true;
		results = [];

		try {
			const allBooks = await getBooks().catch(() => [] as BibleBook[]);
			const popularSlugs = ['genesis', 'john', 'psalms', 'matthew', 'romans'];
			const targetSlugs = allBooks.length > 0 ? allBooks.slice(0, 10).map((b) => b.slug) : popularSlugs;

			const loadedChapters = [];
			for (const slug of targetSlugs) {
				const bookMeta = allBooks.find((b) => b.slug === slug);
				const bookName = bookMeta?.names[0] ?? slug;

				let verses = await getCachedChapter(slug, 1);
				if (!verses || verses.length === 0) {
					verses = await readChapter(slug, 1).catch(() => []);
				}

				if (verses && verses.length > 0) {
					loadedChapters.push({
						bookSlug: slug,
						bookName,
						chapter: 1,
						verses
					});
				}
			}

			results = searchVerses(trimmed, loadedChapters);
		} finally {
			searching = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			performSearch();
		}
	}
</script>

<svelte:head>
	<title>Búsqueda en la Biblia RVR1960 — Discipulado</title>
</svelte:head>

<nav class="top-bar__breadcrumb" aria-label="Ubicación actual" style="margin-bottom: var(--sp-6);">
	<a href="/">Inicio</a>
	<span aria-hidden="true">›</span>
	<span>Búsqueda</span>
</nav>

<h1 class="section-title">Buscador Bíblico RVR1960</h1>

<div class="search-bar">
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
		placeholder="Ej: Juan 3:16 o palabra 'amor'..."
		bind:value={query}
		onkeydown={handleKeydown}
		aria-label="Buscar pasaje o palabra clave"
	/>
</div>

{#if parsedRef.isReference}
	<div class="ref-preview" style="margin-bottom:var(--sp-6);">
		<p style="font-size:0.85rem;color:var(--clr-accent);">
			Ir directamente a <strong>{parsedRef.bookName} {parsedRef.chapter}{parsedRef.verse ? `:${parsedRef.verse}` : ''}</strong>
		</p>
		<button
			class="chapter-nav__btn"
			onclick={performSearch}
			style="margin-top:var(--sp-2);padding:var(--sp-2) var(--sp-4);"
		>
			Ir al pasaje →
		</button>
	</div>
{/if}

{#if searching}
	<div class="state-loading" aria-live="polite" aria-busy="true">
		<div class="spinner" role="status" aria-label="Buscando..."></div>
		<span>Buscando pasajes...</span>
	</div>
{:else if results.length > 0}
	<h2 class="section-subtitle">{results.length} resultados encontrados</h2>
	<div class="verse-list" aria-label="Resultados de búsqueda">
		{#each results as item (item.bookSlug + item.chapter + item.verseNumber)}
			<a
				href="/{item.bookSlug}/{item.chapter}#v{item.verseNumber}"
				class="verse-item"
				style="text-decoration:none;"
			>
				<span class="verse-num">{item.bookName} {item.chapter}:{item.verseNumber}</span>
				<p class="verse-text">{@html item.highlightedHtml}</p>
			</a>
		{/each}
	</div>
{:else if query.trim().length >= 2}
	<p class="state-loading">Presiona Enter o haz clic en buscar para obtener resultados de «{query}».</p>
{/if}
