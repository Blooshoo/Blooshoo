<script lang="ts">
	import type { PageData } from './$types';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';

	let { data } = $props<{ data: PageData }>();

	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}
</script>

<svelte:head>
	<title>Posts — bloo</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-slate-100" style="font-family: var(--font-heading)">Posts</h1>
		<a href="/bloo/posts/new" class="btn-cyan">New post</a>
	</div>

	{#if data.posts.length === 0}
		<div class="rounded-lg border border-slate-800/60 bg-slate-900/40 py-20 text-center">
			<p class="text-slate-400">No posts yet.</p>
			<a href="/bloo/posts/new" class="btn-cyan mt-4 inline-flex">Create your first post</a>
		</div>
	{:else}
		<div class="overflow-hidden rounded-lg border border-slate-800/60">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-slate-800/60 bg-slate-900/60 text-left">
						<th class="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Title</th>
						<th class="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 sm:table-cell">Tags</th>
						<th class="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
						<th class="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 md:table-cell">Date</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.posts as post (post.id)}
						<tr class="border-b border-slate-800/40 transition-colors last:border-0 hover:bg-slate-800/20">
							<td class="px-4 py-3 font-medium text-slate-200">{post.title}</td>
							<td class="hidden px-4 py-3 sm:table-cell">
								<div class="flex flex-wrap gap-1">
									{#each post.tags.slice(0, 2) as tag (tag)}
										<span class="rounded-full bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400">{tag}</span>
									{/each}
									{#if post.tags.length > 2}
										<span class="text-xs text-slate-500">+{post.tags.length - 2}</span>
									{/if}
								</div>
							</td>
							<td class="px-4 py-3">
								<StatusBadge status={post.status} />
							</td>
							<td class="hidden px-4 py-3 text-slate-500 md:table-cell">
								{formatDate(post.createdAt)}
							</td>
							<td class="px-4 py-3 text-right">
								<a
									href="/bloo/posts/{post.id}"
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
