<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description = undefined,
		headerAction = undefined,
		children
	} = $props<{
		title: string;
		description?: string;
		headerAction?: Snippet;
		children: Snippet;
	}>();
</script>

<div
	class="rounded-lg border border-slate-800/60 bg-slate-900/40 shadow-card transition-all duration-300"
>
	<div class="flex items-center justify-between border-b border-slate-800/60 px-5 py-4">
		<div>
			<h2 class="text-sm font-semibold text-slate-200">{title}</h2>
			{#if description}
				<p class="mt-0.5 text-xs text-slate-500">{description}</p>
			{/if}
		</div>
		{#if headerAction}
			{@render headerAction()}
		{/if}
	</div>
	<div class="p-5">
		{@render children()}
	</div>
</div>
