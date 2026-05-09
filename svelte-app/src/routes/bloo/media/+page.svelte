<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}

	let uploadError = $state('');
	let uploading = $state(false);

	async function handleUpload(e: Event) {
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		uploading = true;
		uploadError = '';

		try {
			const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
			if (!res.ok) {
				const json = await res.json().catch(() => ({}));
				uploadError = json.error ?? 'Upload failed';
			} else {
				form.reset();
				// Reload to show new file
				window.location.reload();
			}
		} catch {
			uploadError = 'Upload failed';
		} finally {
			uploading = false;
		}
	}
</script>

<svelte:head>
	<title>Media — bloo</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-slate-100" style="font-family: var(--font-heading)">Media</h1>

	<!-- Upload form -->
	<div class="rounded-lg border border-slate-800/60 bg-slate-900/40 p-4">
		<h2 class="mb-3 text-sm font-semibold text-slate-300">Upload file</h2>
		{#if uploadError}
			<div class="mb-3 rounded border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-400">
				{uploadError}
			</div>
		{/if}
		<form onsubmit={handleUpload} class="flex items-center gap-3">
			<input type="file" name="file" required class="input-dark text-sm" />
			<button type="submit" class="btn-cyan shrink-0" disabled={uploading}>
				{uploading ? 'Uploading…' : 'Upload'}
			</button>
		</form>
	</div>

	{#if data.media.length === 0}
		<div class="rounded-lg border border-slate-800/60 bg-slate-900/40 py-20 text-center">
			<p class="text-slate-400">No media files yet.</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each data.media as item (item.id)}
				<div class="group relative overflow-hidden rounded-lg border border-slate-800/60 bg-slate-900/40">
					{#if item.mimeType.startsWith('image/')}
						<img src={item.url} alt={item.filename} class="h-32 w-full object-cover" />
					{:else}
						<div class="flex h-32 items-center justify-center">
							<span class="text-xs text-slate-500">{item.mimeType}</span>
						</div>
					{/if}
					<div class="p-3">
						<p class="truncate text-xs font-medium text-slate-300">{item.filename}</p>
						<div class="mt-1 flex items-center justify-between">
							<span class="text-xs text-slate-500">{formatSize(item.size)}</span>
							<span class="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
						</div>
						<div class="mt-2 flex gap-2">
							<a
								href={item.url}
								target="_blank"
								rel="noopener noreferrer"
								class="text-xs text-cyan-400 hover:underline"
							>
								View
							</a>
							<button
								onclick={() => navigator.clipboard.writeText(item.url)}
								class="text-xs text-slate-400 hover:text-slate-200"
							>
								Copy URL
							</button>
							<form method="POST" action="?/delete" use:enhance class="ml-auto">
								<input type="hidden" name="id" value={item.id} />
								<button
									type="submit"
									class="text-xs text-red-400 hover:text-red-300"
									onclick={(e) => {
										if (!confirm('Delete this file?')) e.preventDefault();
									}}
								>
									Delete
								</button>
							</form>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
