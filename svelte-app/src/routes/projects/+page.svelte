<script lang="ts">
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	let selectedUserId = $state<string | null>(null);

	const selectedUser = $derived(
		selectedUserId ? data.friends.find((f: { id: string }) => f.id === selectedUserId) : null
	);

	const userProjects = $derived(
		selectedUserId ? data.projects.filter((p: { ownerId: string }) => p.ownerId === selectedUserId) : []
	);
</script>

<svelte:head>
	<title>Friendship Circle — blooshoo</title>
	<meta name="description" content="Blooshoo's Friendship Circle — projects from friends." />
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-16">
	<div class="content-block">
		<div class="mb-10">
			<h1 class="text-3xl font-bold tracking-tight" style="font-family: var(--font-heading)">
				Friendship Circle
			</h1>
			<p class="mt-2 text-slate-400">Click on a friend to see their projects.</p>
		</div>

		<!-- Friends grid -->
		<div class="mb-10 flex flex-wrap gap-3">
			{#each data.friends as friend (friend.id)}
				<button
					class="rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 {selectedUserId === friend.id
						? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-glow-cyan-sm'
						: 'border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'}"
					onclick={() =>
						(selectedUserId = selectedUserId === friend.id ? null : friend.id)}
				>
					{friend.displayName}
					{#if friend.role === 'admin'}
						<span class="ml-1 text-xs opacity-60">★</span>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Selected user's projects -->
		{#if selectedUser}
			<div class="space-y-6">
				<h2 class="text-xl font-semibold text-slate-200" style="font-family: var(--font-heading)">
					{selectedUser.displayName}'s projects
				</h2>

				{#if userProjects.length === 0}
					<p class="text-slate-500">No projects yet.</p>
				{:else}
					<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each userProjects as project (project.id)}
							<div
								class="group rounded-lg border border-slate-800/60 bg-slate-900/40 p-4 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-glow-cyan-sm"
							>
								{#if project.image}
									<img
										src={project.image}
										alt={project.title}
										class="mb-3 h-32 w-full rounded-md object-cover"
									/>
								{/if}
								<div class="flex items-start justify-between gap-2">
									<h3
										class="font-semibold text-slate-200 transition-colors group-hover:text-cyan-400"
									>
										{project.title}
									</h3>
									<span
										class="shrink-0 rounded-full border border-slate-700/50 bg-slate-800/40 px-2 py-0.5 text-xs text-slate-500"
									>
										{project.category}
									</span>
								</div>
								<p class="mt-1 line-clamp-2 text-sm text-slate-500">{project.description}</p>
								{#if project.links.length > 0}
									<div class="mt-3 flex flex-wrap gap-2">
										{#each project.links as link (link.url)}
											<a
												href={link.url}
												target="_blank"
												rel="noopener noreferrer"
												class="text-xs text-cyan-400 hover:underline"
											>
												{link.label} ↗
											</a>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{:else}
			<!-- Show admin's featured projects by default -->
			{@const adminUser = data.friends.find((f: { role: string }) => f.role === 'admin')}
			{@const adminProjects = adminUser
				? data.projects.filter((p: { ownerId: string; featured: boolean }) => p.ownerId === adminUser.id && p.featured)
				: []}
			{#if adminProjects.length > 0}
				<div class="space-y-6">
					<h2
						class="text-xl font-semibold text-slate-200"
						style="font-family: var(--font-heading)"
					>
						Featured projects
					</h2>
					<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each adminProjects as project (project.id)}
							<div
								class="group rounded-lg border border-slate-800/60 bg-slate-900/40 p-4 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-glow-cyan-sm"
							>
								{#if project.image}
									<img
										src={project.image}
										alt={project.title}
										class="mb-3 h-32 w-full rounded-md object-cover"
									/>
								{/if}
								<h3
									class="font-semibold text-slate-200 transition-colors group-hover:text-cyan-400"
								>
									{project.title}
								</h3>
								<p class="mt-1 line-clamp-2 text-sm text-slate-500">{project.description}</p>
								{#if project.links.length > 0}
									<div class="mt-3 flex flex-wrap gap-2">
										{#each project.links as link (link.url)}
											<a
												href={link.url}
												target="_blank"
												rel="noopener noreferrer"
												class="text-xs text-cyan-400 hover:underline"
											>
												{link.label} ↗
											</a>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
