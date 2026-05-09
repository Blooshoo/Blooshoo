<script lang="ts">
	interface SceneInfo {
		name: string;
		mode: string;
		color: string;
	}

	let open = $state(false);
	let scenes = $state<SceneInfo[]>([]);
	let currentScene = $state<string | null>(null);
	let menuEl = $state<HTMLDivElement>();

	$effect(() => {
		function handleScenesList(e: Event) {
			const detail = (e as CustomEvent).detail;
			if (detail?.scenes) scenes = detail.scenes;
			if (detail?.current) currentScene = detail.current;
		}

		window.addEventListener('blooshoo:scenes-list', handleScenesList);
		window.dispatchEvent(new CustomEvent('blooshoo:request-scenes'));

		return () => window.removeEventListener('blooshoo:scenes-list', handleScenesList);
	});

	$effect(() => {
		if (open) {
			window.dispatchEvent(new CustomEvent('blooshoo:request-scenes'));

			function onDown(e: MouseEvent) {
				if (menuEl && !menuEl.contains(e.target as Node)) open = false;
			}
			function onKey(e: KeyboardEvent) {
				if (e.key === 'Escape') open = false;
			}

			document.addEventListener('mousedown', onDown);
			document.addEventListener('keydown', onKey);

			return () => {
				document.removeEventListener('mousedown', onDown);
				document.removeEventListener('keydown', onKey);
			};
		}
	});

	function selectScene(name: string) {
		window.dispatchEvent(new CustomEvent('blooshoo:switch-scene', { detail: { name } }));
		open = false;
	}
</script>

<span class="relative inline">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<span
		role="button"
		tabindex="0"
		onclick={() => (open = !open)}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') open = !open;
		}}
		class="cursor-pointer select-none underline decoration-dotted underline-offset-2 transition-colors"
		style="color: var(--color-accent-teal); opacity: 0.7;"
		title="Pick a scene…"
		aria-label="Scene picker"
	>
		s
	</span>

	{#if open}
		<div
			bind:this={menuEl}
			class="absolute bottom-full left-1/2 z-50 mb-2 min-w-45 -translate-x-1/2 rounded-lg border border-slate-700/60 bg-slate-900/95 p-2 shadow-xl backdrop-blur"
		>
			<span class="mb-1 block px-2 py-1 text-[10px] uppercase tracking-widest text-slate-500">
				Scene Picker
			</span>
			{#if scenes.length === 0}
				<span class="block px-2 py-1 text-xs text-slate-500">Loading…</span>
			{/if}
			{#each scenes as s (s.name)}
				<button
					type="button"
					onclick={() => selectScene(s.name)}
					class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors {s.name ===
					currentScene
						? 'bg-cyan-500/10 text-cyan-400'
						: 'text-slate-300 hover:bg-slate-800/60'}"
				>
					<span
						class="inline-block size-2 shrink-0 rounded-full"
						style="background-color: {s.color}"
					></span>
					<span class="truncate">{s.name}</span>
				</button>
			{/each}
		</div>
	{/if}
</span>
