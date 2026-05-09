<script lang="ts">
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	const arrowLeftIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`;
</script>

<svelte:head>
	<title>{data.post.title} — blooshoo</title>
	{#if data.post.excerpt}
		<meta name="description" content={data.post.excerpt} />
	{/if}
	{#if data.post.coverImage}
		<meta property="og:image" content={data.post.coverImage} />
	{/if}
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-16">
	<div class="content-block">
		<a
			href="/blog"
			class="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-cyan-400"
		>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html arrowLeftIcon}
			Back to blog
		</a>

		{#if data.post.coverImage}
			<div class="mb-8 overflow-hidden rounded-lg">
				<img src={data.post.coverImage} alt={data.post.title} class="h-64 w-full object-cover" />
			</div>
		{/if}

		<header class="mb-8 space-y-4">
			<h1 class="text-3xl font-bold leading-tight text-slate-100 sm:text-4xl" style="font-family: var(--font-heading)">
				{data.post.title}
			</h1>

			<div class="flex flex-wrap items-center gap-3 text-sm text-slate-500">
				{#if data.post.authorDisplayName}
					<span>{data.post.authorDisplayName}</span>
					<span>·</span>
				{/if}
				<time datetime={new Date(data.post.createdAt).toISOString()}>
					{formatDate(data.post.createdAt)}
				</time>
			</div>

			{#if data.post.tags.length > 0}
				<div class="flex flex-wrap gap-2">
					{#each data.post.tags as tag (tag)}
						<span
							class="rounded-full border border-slate-700/50 bg-slate-800/40 px-3 py-1 text-xs text-slate-400"
						>
							{tag}
						</span>
					{/each}
				</div>
			{/if}
		</header>

		<article class="prose prose-invert prose-slate max-w-none">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html data.post.cleanContent}
		</article>
	</div>
</div>
