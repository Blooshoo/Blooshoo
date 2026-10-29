<script lang="ts">
	import './layout.css';
	import { Toaster } from 'svelte-sonner';
	import PublicNav from '$lib/components/layout/PublicNav.svelte';
	import PublicFooter from '$lib/components/layout/PublicFooter.svelte';
	import CanvasBackground from '$lib/components/ui/CanvasBackground.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	const isAdmin = $derived(
		$page.url.pathname === '/bloo' || $page.url.pathname.startsWith('/bloo/')
	);
</script>

{#if !isAdmin}
	<!-- Error pages paint their own status-specific scene; don't run two. -->
	{#if !$page.error}
		<CanvasBackground />
	{/if}
	<PublicNav />
{/if}

<main class="relative z-10 flex min-h-screen flex-col" class:pt-0={isAdmin} class:pb-12={!isAdmin}>
	{@render children()}
</main>

{#if !isAdmin}
	<PublicFooter />
{/if}

<Toaster richColors position="bottom-right" />
