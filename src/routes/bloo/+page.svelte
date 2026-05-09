<script lang="ts">
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const statItems = $derived([
		{ label: 'Published posts', value: data.stats.publishedPosts, href: '/bloo/posts' },
		{ label: 'Draft posts', value: data.stats.draftPosts, href: '/bloo/posts' },
		{ label: 'Projects', value: data.stats.projects, href: '/bloo/projects' },
		{ label: 'Media files', value: data.stats.media, href: '/bloo/media' },
		{ label: 'Unread messages', value: data.stats.unreadMessages, href: '/bloo/messages' }
	]);
</script>

<svelte:head>
	<title>Dashboard — bloo</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-slate-100" style="font-family: var(--font-heading)">
			Dashboard
		</h1>
		<p class="mt-1 text-sm text-slate-400">Welcome back.</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
		{#each statItems as stat (stat.label)}
			<a
				href={stat.href}
				class="group rounded-lg border border-slate-800/60 bg-slate-900/40 p-4 transition-all duration-200 hover:border-cyan-500/30 hover:shadow-glow-cyan-sm"
			>
				<p class="text-xs font-medium uppercase tracking-wider text-slate-500">{stat.label}</p>
				<p
					class="mt-2 text-3xl font-bold tabular-nums text-slate-100 transition-colors group-hover:text-cyan-400"
				>
					{stat.value}
				</p>
			</a>
		{/each}
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<a
			href="/bloo/posts/new"
			class="btn-cyan flex items-center gap-2"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
			New post
		</a>
		<a
			href="/bloo/projects/new"
			class="btn-ghost flex items-center gap-2"
		>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
			New project
		</a>
	</div>
</div>
