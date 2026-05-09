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

	const arrowRightIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
</script>

<svelte:head>
	<title>blooshoo</title>
	<meta name="description" content="Personal site of blooshoo — projects, blog, and more." />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-12 px-4 py-8 sm:py-16">
	<div class="content-block space-y-12 sm:space-y-20">
		<!-- Hero -->
		<section class="space-y-4">
			<h1
				class="text-3xl font-bold tracking-tight sm:text-4xl"
				style="font-family: var(--font-heading)"
			>
				Hi, I'm <span style="color: var(--color-accent-teal)">blooshoo</span><span
					class="blink-cursor"
					aria-hidden="true"
				></span>
			</h1>
			<p class="max-w-xl text-lg leading-relaxed text-bloo-muted">
				I build things for the web and occasionally write about it. This is my little corner of the
				internet — projects, thoughts, and whatever else I find interesting.
			</p>
			<div class="flex gap-3 pt-2">
				<a
					href="/blog"
					class="inline-flex items-center gap-1.5 text-sm font-medium text-bloo-muted transition-colors hover:text-accent-teal"
				>
					Read the blog
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html arrowRightIcon}
				</a>
				<span class="text-bloo-muted">·</span>
				<a
					href="/projects"
					class="inline-flex items-center gap-1.5 text-sm font-medium text-bloo-muted transition-colors hover:text-accent-teal"
				>
					See projects
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html arrowRightIcon}
				</a>
			</div>
		</section>

		<!-- Latest Posts -->
		{#if data.latestPosts.length > 0}
			<section class="space-y-6">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-semibold" style="font-family: var(--font-heading)">
						Latest posts
					</h2>
					<a
						href="/blog"
					class="flex items-center gap-1 text-sm text-bloo-muted transition-colors hover:text-accent-teal"
					>
						All posts
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
					</a>
				</div>
				<div class="space-y-0">
					{#each data.latestPosts as post (post.id)}
						<a
							href="/blog/{post.slug}"
							class="group -mx-2 flex items-start justify-between gap-4 rounded-md border-b border-white/8 px-2 py-4 transition-colors last:border-0 hover:bg-bloo-card/60"
						>
							<div class="min-w-0 space-y-1">
								<p class="truncate font-medium transition-colors group-hover:text-accent-teal">
									{post.title}
								</p>
								{#if post.excerpt}
									<p class="line-clamp-1 text-sm text-bloo-muted">{post.excerpt}</p>
								{/if}
								{#if post.tags.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each post.tags.slice(0, 3) as tag (tag)}
											<span
												class="rounded-full border border-slate-700/50 bg-slate-800/40 px-2 py-0.5 text-xs text-slate-400"
											>
												{tag}
											</span>
										{/each}
									</div>
								{/if}
							</div>
							<time
							class="shrink-0 text-xs text-bloo-muted"
								datetime={new Date(post.createdAt).toISOString()}
							>
								{formatDate(post.createdAt)}
							</time>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Featured Projects -->
		{#if data.featuredProjects.length > 0}
			<section class="space-y-6">
				<h2 class="text-xl font-semibold" style="font-family: var(--font-heading)">
					Featured projects
				</h2>
				<div class="grid gap-4 sm:grid-cols-2">
					{#each data.featuredProjects as project (project.id)}
						<div
							class="group rounded-lg border border-white/8 bg-bloo-card/40 p-4 transition-all duration-300 hover:border-accent-teal/30 hover:shadow-glow-teal-sm"
						>
							{#if project.image}
								<img
									src={project.image}
									alt={project.title}
									class="mb-3 h-32 w-full rounded-md object-cover"
								/>
							{/if}
							<h3 class="font-semibold text-bloo-text transition-colors group-hover:text-accent-teal">
								{project.title}
							</h3>
							<p class="mt-1 line-clamp-2 text-sm text-bloo-muted">{project.description}</p>
							{#if project.links.length > 0}
								<div class="mt-3 flex flex-wrap gap-2">
									{#each project.links as link (link.url)}
										<a
											href={link.url}
											target="_blank"
											rel="noopener noreferrer"
											class="text-xs text-accent-teal hover:underline"
											onclick={(e) => e.stopPropagation()}
										>
											{link.label} ↗
										</a>
									{/each}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</div>
</div>
