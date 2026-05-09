<script lang="ts">
	let {
		title,
		message,
		actionLabel = undefined,
		onAction = undefined
	} = $props<{
		title: string;
		message: string;
		actionLabel?: string;
		onAction?: () => void;
	}>();
</script>

<div class="flex flex-col items-center justify-center py-16 text-center">
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="48"
		height="48"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="lucide lucide-inbox mb-4 text-slate-600"
	>
		<polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
		<path
			d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
		/>
	</svg>
	<h3 class="text-base font-medium text-slate-300">{title}</h3>
	<p class="mt-1 text-sm text-slate-500">{message}</p>
	{#if actionLabel && onAction}
		<button class="btn-cyan mt-6" onclick={onAction}>{actionLabel}</button>
	{/if}
</div>
