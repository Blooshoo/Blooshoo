<script lang="ts">
	import ScenePicker from '$lib/components/ui/ScenePicker.svelte';
	const year = new Date().getFullYear();
</script>

<footer class="fixed bottom-0 left-0 right-0 z-40 border-t border-white/8 content-panel">
	<div class="mx-auto flex h-12 max-w-3xl items-center justify-center px-4">
		<span class="text-sm text-bloo-muted">
			&copy; {year} bloo<ScenePicker />hoo
		</span>
	</div>
</footer>
