<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getBooks } from '$lib/api/bible';
	import type { BibleBook } from '$lib/api/bible';
	import { Input } from "$lib/components/ui/input/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	let books = $state<BibleBook[]>([]);
	let loading = $state(true);
	let error = $state('');
	let query = $state('');

	let filtered = $derived(
		query.trim()
			? books.filter((b) =>
					b.names.some((n) => n.toLowerCase().includes(query.trim().toLowerCase()))
				)
			: books
	);

	// Separate OT (66 - 39 OT / 27 NT split by index once loaded)
	// We'll split at index 39 (standard Protestant canon order from the API)
	let otBooks = $derived(filtered.filter((_, i) => i < 39));
	let ntBooks = $derived(filtered.filter((_, i) => i >= 39));

	onMount(async () => {
		try {
			books = await getBooks();
		} catch (e) {
			error = (e as Error).message;
		} finally {
			loading = false;
		}
	});

	function selectBook(book: BibleBook) {
		goto(`/${book.slug}`);
	}
</script>

<svelte:head>
	<title>Biblia RVR1960 — Libros</title>
</svelte:head>

{#if loading}
	<div class="state-loading" aria-live="polite" aria-busy="true">
		<div class="spinner" role="status" aria-label="Cargando libros…"></div>
		<span>Cargando libros…</span>
	</div>
{:else if error}
	<div class="state-error" role="alert">
		<strong>Error al cargar los libros:</strong> {error}
	</div>
{:else}
	<h1 class="section-title">Sagradas Escrituras</h1>

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
		<Input
			id="book-search"
			type="search"
			placeholder="Buscar libro…"
			bind:value={query}
			aria-label="Buscar libro"
		/>
	</div>

	{#if otBooks.length > 0}
		<p class="section-subtitle">Antiguo Testamento</p>
		<div class="book-grid" role="list">
			{#each otBooks as book (book.slug)}
				<Button
					variant="outline"
					class="book-card h-auto py-4 flex flex-col items-start gap-1 justify-center"
					id="book-{book.slug}"
					onclick={() => selectBook(book)}
					aria-label="{book.names[0]}, {book.chapters} capítulos"
				>
					<span class="book-card__name font-semibold text-base">{book.names[0]}</span>
					<span class="book-card__chapters text-sm text-muted-foreground">{book.chapters} caps.</span>
				</Button>
			{/each}
		</div>
	{/if}

	{#if ntBooks.length > 0}
		<div class="divider" aria-hidden="true"></div>
		<p class="section-subtitle">Nuevo Testamento</p>
		<div class="book-grid" role="list">
			{#each ntBooks as book (book.slug)}
				<Button
					variant="outline"
					class="book-card h-auto py-4 flex flex-col items-start gap-1 justify-center"
					id="book-{book.slug}"
					onclick={() => selectBook(book)}
					aria-label="{book.names[0]}, {book.chapters} capítulos"
				>
					<span class="book-card__name font-semibold text-base">{book.names[0]}</span>
					<span class="book-card__chapters text-sm text-muted-foreground">{book.chapters} caps.</span>
				</Button>
			{/each}
		</div>
	{/if}

	{#if filtered.length === 0}
		<p class="state-loading">No se encontraron libros para «{query}».</p>
	{/if}
{/if}
