<script lang="ts">
	import './layout.css';
	import { Toaster } from 'svelte-sonner';
	import PublicNav from '$lib/components/layout/PublicNav.svelte';
	import PublicFooter from '$lib/components/layout/PublicFooter.svelte';
	import CanvasBackground from '$lib/components/ui/CanvasBackground.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	const isAdmin = $derived($page.url.pathname.startsWith('/bloo'));
</script>

{#if !isAdmin}
	<CanvasBackground />
	<PublicNav />
{/if}

<main class="flex min-h-screen flex-col" class:pt-0={isAdmin} class:pb-12={!isAdmin}>
	{@render children()}
</main>

{#if !isAdmin}
	<PublicFooter />
{/if}

<Toaster richColors position="bottom-right" />
