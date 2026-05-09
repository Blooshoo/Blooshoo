<script lang="ts">
	import ScenePicker from '$lib/components/ui/ScenePicker.svelte';
	const year = new Date().getFullYear();
</script>

<footer class="mt-auto border-t border-slate-800/60">
	<div class="mx-auto flex h-12 max-w-3xl items-center justify-center px-4">
		<span class="text-sm text-slate-500">
			&copy; {year} bloo<ScenePicker />hoo
		</span>
	</div>
</footer>
