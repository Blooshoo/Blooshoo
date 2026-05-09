<script lang="ts">
	import AdminSidebar from './AdminSidebar.svelte';

	let mobileOpen = $state(false);

	const menuIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`;

	async function handleLogout() {
		const res = await fetch('/api/auth/sign-out', { method: 'POST' });
		if (res.ok) {
			window.location.href = '/bloo/login';
		}
	}
</script>

<header
	class="flex h-14 shrink-0 items-center gap-4 border-b border-slate-800/60 bg-slate-950/80 px-4 shadow-topbar backdrop-blur"
>
	<!-- Mobile hamburger -->
	<button
		class="btn-ghost px-2 py-1.5 lg:hidden"
		aria-label="Open navigation"
		onclick={() => (mobileOpen = !mobileOpen)}
	>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html menuIcon}
	</button>

	<span class="font-semibold tracking-tight text-slate-200">blooshoo admin</span>

	<div class="flex-1"></div>

	<a href="/" class="btn-ghost px-3 py-1.5 text-xs">← View site</a>

	<button class="btn-ghost px-3 py-1.5 text-xs" onclick={handleLogout}>Sign out</button>
</header>

<!-- Mobile drawer overlay -->
{#if mobileOpen}
	<div
		class="fixed inset-0 z-40 bg-black/60 lg:hidden"
		role="button"
		tabindex="-1"
		aria-label="Close navigation"
		onclick={() => (mobileOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (mobileOpen = false)}
	></div>
	<div
		class="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-slate-800/60 bg-slate-950 lg:hidden"
	>
		<div class="flex h-14 items-center border-b border-slate-800/60 px-4">
			<span class="font-semibold text-slate-200">blooshoo admin</span>
		</div>
		<AdminSidebar onNavClick={() => (mobileOpen = false)} />
	</div>
{/if}
