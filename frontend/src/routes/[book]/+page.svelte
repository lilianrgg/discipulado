<script lang="ts">
	import { goto } from '$app/navigation';
	import { getBooks } from '$lib/api/bible';
	import type { BibleBook } from '$lib/api/bible';

	let { data } = $props();

	let bookMeta = $state<BibleBook | null>(null);
	let loading = $state(true);
	let error = $state('');

	let bookLabel = $derived(bookMeta?.names[0] ?? data.book);

	$effect(() => {
		const currentBook = data.book;
		loading = true;
		error = '';

		getBooks()
			.then((allBooks) => {
				bookMeta = allBooks.find((b) => b.slug === currentBook) ?? null;
				if (!bookMeta) error = `No se encontró el libro «${currentBook}».`;
			})
			.catch((e) => {
				error = (e as Error).message;
			})
			.finally(() => {
				loading = false;
			});
	});

	function selectChapter(ch: number) {
		goto(`/${data.book}/${ch}`);
	}
</script>

<svelte:head>
	<title>{bookLabel} — Capítulos · Biblia RVR1960</title>
</svelte:head>

<nav class="top-bar__breadcrumb" aria-label="Ubicación actual" style="margin-bottom:var(--sp-6);">
	<a href="/">Inicio</a>
	<span aria-hidden="true">›</span>
	<span>{bookLabel}</span>
</nav>

{#if loading}
	<div class="state-loading" aria-live="polite" aria-busy="true">
		<div class="spinner" role="status" aria-label="Cargando…"></div>
	</div>
{:else if error}
	<div class="state-error" role="alert">{error}</div>
{:else if bookMeta}
	<h1 class="section-title">{bookLabel}</h1>
	<p class="section-subtitle">{bookMeta.chapters} capítulos · RVR1960</p>

	<div class="chapter-grid" role="list" aria-label="Capítulos de {bookLabel}">
		{#each { length: bookMeta.chapters } as _, i}
			{@const ch = i + 1}
			<button
				class="chapter-btn"
				id="chapter-{ch}"
				onclick={() => selectChapter(ch)}
				aria-label="Ir al capítulo {ch}"
			>
				{ch}
			</button>
		{/each}
	</div>
{/if}
