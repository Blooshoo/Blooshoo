<script lang="ts">
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
	<title>Projects — bloo</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-slate-100" style="font-family: var(--font-heading)">Projects</h1>
		<a href="/bloo/projects/new" class="btn-cyan">New project</a>
	</div>

	{#if data.projects.length === 0}
		<div class="rounded-lg border border-slate-800/60 bg-slate-900/40 py-20 text-center">
			<p class="text-slate-400">No projects yet.</p>
			<a href="/bloo/projects/new" class="btn-cyan mt-4 inline-flex">Add first project</a>
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg border border-slate-800/60">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-slate-800/60 bg-slate-900/60 text-left">
						<th class="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Title</th>
						<th class="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 sm:table-cell">Category</th>
						<th class="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 md:table-cell">Owner</th>
						<th class="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Featured</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.projects as project (project.id)}
						<tr class="border-b border-slate-800/40 transition-colors last:border-0 hover:bg-slate-800/20">
							<td class="px-4 py-3 font-medium text-slate-200">{project.title}</td>
							<td class="hidden px-4 py-3 text-slate-400 sm:table-cell">{project.category}</td>
							<td class="hidden px-4 py-3 text-slate-400 md:table-cell">{project.ownerType}</td>
							<td class="px-4 py-3">
								{#if project.featured}
									<span class="text-xs text-amber-400">★ Featured</span>
								{:else}
									<span class="text-xs text-slate-600">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right">
								<a
									href="/bloo/projects/{project.id}"
									class="text-xs text-slate-400 transition-colors hover:text-cyan-400"
								>
									Edit
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
