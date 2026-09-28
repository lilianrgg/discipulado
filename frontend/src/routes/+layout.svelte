<script lang="ts">
	import './layout.css';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Discipulado — Biblia RVR1960</title>

	<meta
		name="description"
		content="Lee la Biblia Reina-Valera 1960 sin necesidad de crear una cuenta."
	/>
</svelte:head>

<div class="page-shell">
	<header class="top-bar">
		<a href="/" class="top-bar__logo">✦ Discipulado</a>

		<a
			href="/search"
			class="top-bar__back"
			style="margin-left:auto;"
		>🔍 Buscar</a>

		<span
			class="guest-badge"
			style="margin-left:var(--sp-2);"
		>Invitado</span>
	</header>

	<main class="page-content">{@render children()}</main>
</div>
