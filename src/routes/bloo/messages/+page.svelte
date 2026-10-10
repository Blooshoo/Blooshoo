<script lang="ts">
	import { enhance } from '$app/forms';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	let expandedId = $state<string | null>(null);
</script>

<svelte:head>
	<title>Messages — bloo</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-slate-100" style="font-family: var(--font-heading)">Messages</h1>

	{#if data.messages.length === 0}
		<div class="rounded-lg border border-slate-800/60 bg-slate-900/40 py-20 text-center">
			<p class="text-slate-400">No messages yet.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each data.messages as msg (msg.id)}
				<div
					class="rounded-lg border border-slate-800/60 bg-slate-900/40 {msg.status === 'unread'
						? 'border-l-2 border-l-cyan-500/50'
						: ''}"
				>
					<button
						class="flex w-full items-center justify-between gap-4 p-4 text-left"
						onclick={() => (expandedId = expandedId === msg.id ? null : msg.id)}
					>
						<div class="min-w-0 space-y-0.5">
							<p class="font-semibold text-slate-200">{msg.name}</p>
							<p class="text-xs text-slate-500">{msg.email}</p>
						</div>
						<div class="flex shrink-0 items-center gap-3">
							<StatusBadge status={msg.status} />
							<time class="hidden text-xs text-slate-500 sm:block">
								{formatDate(msg.createdAt)}
							</time>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="shrink-0 text-slate-500 transition-transform {expandedId === msg.id
									? 'rotate-180'
									: ''}"
							><path d="m6 9 6 6 6-6" /></svg>
						</div>
					</button>

					{#if expandedId === msg.id}
						<div class="border-t border-slate-800/60 px-4 py-4 space-y-4">
							<p class="whitespace-pre-wrap text-sm text-slate-300">{msg.message}</p>

							<div class="flex flex-wrap gap-2">
								<form method="POST" action="?/updateStatus" use:enhance>
									<input type="hidden" name="id" value={msg.id} />
									<input type="hidden" name="status" value="read" />
									<button type="submit" class="btn-ghost text-xs">Mark read</button>
								</form>
								<form method="POST" action="?/updateStatus" use:enhance>
									<input type="hidden" name="id" value={msg.id} />
									<input type="hidden" name="status" value="replied" />
									<button type="submit" class="btn-ghost text-xs">Mark replied</button>
								</form>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={msg.id} />
									<button
										type="submit"
										class="btn-destructive text-xs"
										onclick={(e) => {
											if (!confirm('Delete this message?')) e.preventDefault();
										}}
									>
										Delete
									</button>
								</form>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
