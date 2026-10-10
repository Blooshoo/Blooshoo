<script lang="ts">
	let {
		title,
		value,
		icon = undefined,
		trend = undefined
	} = $props<{
		title: string;
		value: string | number;
		icon?: string;
		trend?: string;
	}>();
</script>

<div
	class="group rounded-lg border border-slate-800/60 bg-slate-900/40 p-5 shadow-card transition-all duration-300 hover:border-cyan-500/30 hover:shadow-glow-cyan-sm"
>
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<p class="label-caps">{title}</p>
			<p class="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
			{#if trend}
				<p class="mt-1 text-xs text-slate-500">{trend}</p>
			{/if}
		</div>
		{#if icon}
			<span
				class="text-slate-500 transition-colors duration-300 group-hover:text-cyan-400 group-hover:drop-shadow-glow-cyan-md"
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html icon}
			</span>
		{/if}
	</div>
</div>
