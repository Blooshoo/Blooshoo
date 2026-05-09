<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description = undefined
	} = $props<{
		title: string;
		description?: string;
	}>();
</script>

<div class="mb-6">
	<h1 class="font-heading text-3xl text-slate-100" style="font-family: var(--font-heading)">
		{title}
	</h1>
	{#if description}
		<p class="mt-1 text-sm text-slate-400">{description}</p>
	{/if}
</div>
