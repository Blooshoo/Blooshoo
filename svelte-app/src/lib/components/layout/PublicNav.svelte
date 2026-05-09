<script lang="ts">
	import { page } from '$app/stores';

	const navLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/blog', label: 'Blog' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/contact', label: 'Contact' }
	];

	let menuOpen = $state(false);
	const pathname = $derived($page.url.pathname);
</script>

<header class="sticky top-0 z-50 border-b border-white/8 content-panel">
	<div class="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
		<a href="/" aria-label="blooshoo home" class="shrink-0">
			<span class="logo-glitch text-2xl sm:text-3xl">BLOOSHOO</span>
		</a>

		<!-- Desktop nav -->
		<nav class="hidden items-center gap-1 sm:flex">
			{#each navLinks as { href, label } (href)}
				<a
					{href}
					class="nav-link px-3 py-1.5 text-sm font-medium"
					class:text-accent-teal={pathname === href}
				>
					{label}
				</a>
			{/each}
		</nav>

		<!-- Mobile hamburger -->
		<button
			class="btn-ghost px-2 py-1.5 sm:hidden"
			aria-label="Open navigation"
			onclick={() => (menuOpen = !menuOpen)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-menu"
			>
				<line x1="4" x2="20" y1="6" y2="6" />
				<line x1="4" x2="20" y1="12" y2="12" />
				<line x1="4" x2="20" y1="18" y2="18" />
			</svg>
		</button>
	</div>

	<!-- Mobile menu -->
	{#if menuOpen}
		<nav class="border-t border-slate-800/60 px-4 py-3 sm:hidden">
			<div class="flex flex-col gap-1">
				{#each navLinks as { href, label } (href)}
					<a
						{href}
						class="rounded-md px-3 py-2 text-sm font-medium transition-colors {pathname === href
							? 'bg-cyan-500/10 text-cyan-400'
							: 'text-slate-400'}"
						onclick={() => (menuOpen = false)}
					>
						{label}
					</a>
				{/each}
			</div>
		</nav>
	{/if}
</header>
