<script lang="ts">
	import { enhance } from '$app/forms';
	import ProjectForm from '../ProjectForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();
</script>

<svelte:head>
	<title>Edit project — bloo</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-slate-100" style="font-family: var(--font-heading)">
			Edit project
		</h1>
		<form method="POST" action="?/delete" use:enhance>
			<button
				type="submit"
				class="btn-destructive text-sm"
				onclick={(e) => {
					if (!confirm('Delete this project?')) e.preventDefault();
				}}
			>
				Delete
			</button>
		</form>
	</div>

	{#if form?.success}
		<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
			Project saved.
		</div>
	{/if}

	<ProjectForm project={data.project} action="?/update" error={form?.error} users={data.users} />
</div>
