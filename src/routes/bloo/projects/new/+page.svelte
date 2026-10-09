<script lang="ts">
	import ProjectForm from '../ProjectForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();
</script>

<svelte:head>
	<title>New project — bloo</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-slate-100" style="font-family: var(--font-heading)">
		New project
	</h1>
	<ProjectForm action="?/default" error={form?.error} users={data.users} />
</div>
