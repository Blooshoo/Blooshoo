<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	let {
		columns,
		data,
		rowSnippet
	} = $props<{
		columns: { key: string; label: string; class?: string }[];
		data: T[];
		rowSnippet: Snippet<[T]>;
	}>();
</script>

<div class="overflow-x-auto">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-slate-800/60">
				{#each columns as col (col.key)}
					<th
						class="label-caps px-4 py-3 text-left {col.class ?? ''}"
					>
						{col.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody class="divide-y divide-slate-800/40">
			{#each data as row (row)}
				{@render rowSnippet(row)}
			{/each}
		</tbody>
	</table>
</div>
