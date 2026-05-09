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
</script>

<svelte:head>
	<title>Blog — blooshoo</title>
	<meta name="description" content="Thoughts, articles, and notes by blooshoo" />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-16">
	<div class="content-block">
		<div class="mb-12">
			<h1 class="text-3xl font-bold tracking-tight" style="font-family: var(--font-heading)">
				Blog
			</h1>
			<p class="mt-2 text-slate-400">Thoughts, articles, and notes.</p>
		</div>

		{#if data.posts.length === 0}
			<div class="py-20 text-center">
				<p class="text-lg text-slate-400">No posts yet.</p>
				<p class="mt-1 text-sm text-slate-500">Check back soon!</p>
			</div>
		{:else}
			<div class="space-y-0">
				{#each data.posts as post (post.id)}
					<article class="group border-b border-slate-800/60 py-8 first:pt-0 last:border-0">
						<a href="/blog/{post.slug}" class="block space-y-3">
							{#if post.coverImage}
								<div class="relative mb-4 h-48 overflow-hidden rounded-lg bg-slate-900">
									<img
										src={post.coverImage}
										alt={post.title}
										class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								</div>
							{/if}
							<div class="space-y-2">
								<h2
									class="text-xl font-semibold text-slate-200 transition-colors group-hover:text-cyan-400"
									style="font-family: var(--font-heading)"
								>
									{post.title}
								</h2>
								{#if post.excerpt}
									<p class="line-clamp-2 text-sm text-slate-400">{post.excerpt}</p>
								{/if}
								<div class="flex flex-wrap items-center gap-2">
									<time class="text-xs text-slate-500" datetime={new Date(post.createdAt).toISOString()}>
										{formatDate(post.createdAt)}
									</time>
									{#if post.tags.length > 0}
										<span class="text-slate-600">·</span>
										{#each post.tags.slice(0, 4) as tag (tag)}
											<span
												class="rounded-full border border-slate-700/50 bg-slate-800/40 px-2 py-0.5 text-xs text-slate-400"
											>
												{tag}
											</span>
										{/each}
									{/if}
								</div>
							</div>
						</a>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</div>
