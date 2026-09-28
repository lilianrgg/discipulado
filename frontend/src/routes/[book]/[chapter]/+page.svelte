<script lang="ts">
	import { goto } from '$app/navigation';
	import { readChapter, getBooks } from '$lib/api/bible';
	import type { BibleVerse, BibleBook } from '$lib/api/bible';
	import { Button } from "$lib/components/ui/button/index.js";

	let { data } = $props();

	let verses = $state<BibleVerse[]>([]);
	let bookMeta = $state<BibleBook | null>(null);
	let loading = $state(true);
	let error = $state('');

	let bookLabel = $derived(bookMeta?.names[0] ?? data.book);
	let totalChapters = $derived(bookMeta?.chapters ?? 0);
	let hasPrev = $derived(data.chapter > 1);
	let hasNext = $derived(totalChapters > 0 && data.chapter < totalChapters);

	$effect(() => {
		const currentBook = data.book;
		const currentChapter = data.chapter;
		loading = true;
		error = '';

		Promise.all([
			readChapter(currentBook, currentChapter),
			getBooks()
		])
			.then(([chapterData, allBooks]) => {
				verses = chapterData;
				bookMeta = allBooks.find((b) => b.slug === currentBook) ?? null;
			})
			.catch((e) => {
				error = (e as Error).message;
			})
			.finally(() => {
				loading = false;
			});
	});

	function goToPrev() {
		goto(`/${data.book}/${data.chapter - 1}`);
	}
	function goToNext() {
		goto(`/${data.book}/${data.chapter + 1}`);
	}
	function goToChapterList() {
		goto(`/${data.book}`);
	}
</script>

<svelte:head>
	<title>{bookLabel} {data.chapter} — Biblia RVR1960</title>
	<meta name="description" content="Lee {bookLabel} capítulo {data.chapter} en la Biblia Reina-Valera 1960." />
</svelte:head>

<nav class="top-bar__breadcrumb" aria-label="Ubicación actual" style="margin-bottom: var(--sp-4);">
	<a href="/" aria-label="Ir a lista de libros">Inicio</a>
	<span aria-hidden="true">›</span>
	<Button
		variant="link"
		class="h-auto p-0 text-inherit font-inherit no-underline hover:no-underline"
		onclick={goToChapterList}
		aria-label="Ver todos los capítulos de {bookLabel}"
	>
		{bookLabel}
	</Button>
	<span aria-hidden="true">›</span>
	<span>Cap. {data.chapter}</span>
</nav>

{#if loading}
	<div class="state-loading" aria-live="polite" aria-busy="true">
		<div class="spinner" role="status" aria-label="Cargando capítulo…"></div>
		<span>Cargando {bookLabel} {data.chapter}…</span>
	</div>
{:else if error}
	<div class="state-error" role="alert">
		<strong>Error al cargar el capítulo:</strong> {error}
	</div>
{:else}
	<div class="reader-header">
		<h1 class="reader-title">{bookLabel} <span style="color:var(--clr-accent)">{data.chapter}</span></h1>
		<p class="reader-meta">Reina-Valera 1960 &nbsp;·&nbsp; {verses.length} versículos</p>
	</div>

	<ol class="verse-list" aria-label="Versículos de {bookLabel} capítulo {data.chapter}">
		{#each verses as verse (verse.number ?? verse.id)}
			<li class="verse-item" id="v{verse.number}">
				<span class="verse-num" aria-label="Versículo {verse.number}">{verse.number}</span>
				<p class="verse-text">{verse.text}</p>
			</li>
		{/each}
	</ol>

	<nav class="chapter-nav" aria-label="Navegación entre capítulos">
		<Button
			variant="outline"
			class="chapter-nav__btn"
			id="chapter-prev"
			onclick={goToPrev}
			disabled={!hasPrev}
			aria-label="Capítulo anterior"
		>
			← Anterior
		</Button>

		<Button
			variant="outline"
			class="chapter-btn aspect-auto py-2 px-4 text-xs"
			onclick={goToChapterList}
			aria-label="Ver todos los capítulos"
		>
			Capítulos
		</Button>

		<Button
			variant="outline"
			class="chapter-nav__btn"
			id="chapter-next"
			onclick={goToNext}
			disabled={!hasNext}
			aria-label="Capítulo siguiente"
		>
			Siguiente →
		</Button>
	</nav>
{/if}
