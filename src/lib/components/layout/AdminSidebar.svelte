<script lang="ts">
	import { page } from '$app/stores';

	const navItems = [
		{ href: '/bloo', label: 'Dashboard', exact: true, icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>` },
		{ href: '/bloo/posts', label: 'Posts', exact: false, icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>` },
		{ href: '/bloo/projects', label: 'Projects', exact: false, icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-open"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>` },
		{ href: '/bloo/media', label: 'Media', exact: false, icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>` },
		{ href: '/bloo/users', label: 'Users', exact: false, icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
		{ href: '/bloo/messages', label: 'Messages', exact: false, icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>` }
	];

	const bottomItems = [
		{ href: '/bloo/change-password', label: 'Change Password', exact: false, icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-key-round"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>` }
	];

	let { onNavClick = undefined } = $props<{ onNavClick?: () => void }>();

	const pathname = $derived($page.url.pathname);

	function isActive(href: string, exact: boolean) {
		return exact ? pathname === href : pathname.startsWith(href);
	}
</script>

<nav class="flex flex-1 flex-col gap-1 p-3">
	<div class="px-3 py-2">
		<p class="label-caps">Navigation</p>
	</div>

	{#each navItems as item (item.href)}
		{@const active = isActive(item.href, item.exact)}
		<a
			href={item.href}
			onclick={onNavClick}
			class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 {active
				? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan-sm'
				: 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}"
		>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html item.icon}
			{item.label}
		</a>
	{/each}

	<div class="my-2 border-t border-slate-800/60"></div>

	{#each bottomItems as item (item.href)}
		{@const active = isActive(item.href, item.exact)}
		<a
			href={item.href}
			onclick={onNavClick}
			class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 {active
				? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
				: 'border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'}"
		>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html item.icon}
			{item.label}
		</a>
	{/each}
</nav>
