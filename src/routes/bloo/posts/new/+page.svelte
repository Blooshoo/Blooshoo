<script lang="ts">
	import PostForm from '../PostForm.svelte';
	import type { ActionData } from './$types';

	let { form } = $props<{ form: ActionData }>();
</script>

<svelte:head>
	<title>New post — bloo</title>
</svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-slate-100" style="font-family: var(--font-heading)">
		New post
	</h1>
	<PostForm action="?/default" error={form?.error} />
</div>
