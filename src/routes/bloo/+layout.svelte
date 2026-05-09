<script lang="ts">
	import AdminHeader from '$lib/components/layout/AdminHeader.svelte';
	import AdminSidebar from '$lib/components/layout/AdminSidebar.svelte';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	let { data, children } = $props<{ data: LayoutData; children: import('svelte').Snippet }>();

	// Don't render admin shell on login page
	const isLoginPage = $derived($page.url.pathname === '/bloo/login');
</script>

{#if isLoginPage}
	{@render children()}
{:else}
	<div class="flex min-h-screen bg-bloo-bg">
		<!-- CRT scanline overlay -->
		<div class="scanlines" aria-hidden="true"></div>

		<!-- Desktop sidebar -->
		<aside class="hidden w-56 shrink-0 flex-col border-r border-white/8 bg-bloo-card lg:flex">
			<AdminSidebar />
		</aside>

		<!-- Main area -->
		<div class="flex min-w-0 flex-1 flex-col">
			<AdminHeader />
			<main class="flex-1 overflow-y-auto p-6">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
