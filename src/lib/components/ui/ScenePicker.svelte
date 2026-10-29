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
	let triggerEl = $state<HTMLButtonElement>();
	const menuId = 'scene-picker-menu';

	function menuItems(): HTMLButtonElement[] {
		return menuEl ? Array.from(menuEl.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')) : [];
	}

	function focusItem(index: number) {
		const items = menuItems();
		if (items.length === 0) return;
		items[(index + items.length) % items.length].focus();
	}

	function close(returnFocus = true) {
		open = false;
		if (returnFocus) triggerEl?.focus();
	}

	function onMenuKeydown(e: KeyboardEvent) {
		const items = menuItems();
		const index = items.indexOf(document.activeElement as HTMLButtonElement);
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			focusItem(index + 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			focusItem(index - 1);
		} else if (e.key === 'Home') {
			e.preventDefault();
			focusItem(0);
		} else if (e.key === 'End') {
			e.preventDefault();
			focusItem(items.length - 1);
		} else if (e.key === 'Tab') {
			close(false);
		}
	}

	// Move focus into the menu when it opens (or when scenes arrive while open).
	$effect(() => {
		if (open && scenes.length > 0 && !menuEl?.contains(document.activeElement)) {
			const current = scenes.findIndex((s) => s.name === currentScene);
			focusItem(current === -1 ? 0 : current);
		}
	});

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

			function onDown(e: PointerEvent) {
				const target = e.target as Node;
				if (menuEl?.contains(target) || triggerEl?.contains(target)) return;
				close(false);
			}
			function onKey(e: KeyboardEvent) {
				if (e.key === 'Escape') close();
			}

			document.addEventListener('pointerdown', onDown);
			document.addEventListener('keydown', onKey);

			return () => {
				document.removeEventListener('pointerdown', onDown);
				document.removeEventListener('keydown', onKey);
			};
		}
	});

	function selectScene(name: string) {
		window.dispatchEvent(new CustomEvent('blooshoo:switch-scene', { detail: { name } }));
		close();
	}
</script>

<span class="relative inline"><button
		bind:this={triggerEl}
		type="button"
		onclick={() => (open = !open)}
		onkeydown={(e) => {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				e.preventDefault();
				open = true;
			}
		}}
		aria-haspopup="menu"
		aria-expanded={open}
		aria-controls={menuId}
		aria-label="Scene picker"
		title="Pick a scene…"
		class="scene-trigger relative inline cursor-pointer select-none underline decoration-dotted underline-offset-2 transition-colors"
		style="color: var(--color-accent-teal); opacity: 0.7;"
	>s</button>{#if open}<div
			bind:this={menuEl}
			id={menuId}
			role="menu"
			tabindex="-1"
			aria-label="Background scenes"
			onkeydown={onMenuKeydown}
			class="absolute bottom-full left-1/2 z-50 mb-2 min-w-45 -translate-x-1/2 rounded-lg border border-white/8 bg-bloo-bg/95 p-2 shadow-xl backdrop-blur"
		>
			<span class="mb-1 block px-2 py-1 text-[10px] uppercase tracking-widest text-bloo-muted" aria-hidden="true">
				Scene Picker
			</span>
			{#if scenes.length === 0}
				<span class="block px-2 py-1 text-xs text-bloo-muted" role="none">Loading…</span>
			{/if}
			{#each scenes as s (s.name)}
				<button
					type="button"
					role="menuitemradio"
					aria-checked={s.name === currentScene}
					tabindex="-1"
					onclick={() => selectScene(s.name)}
					class="flex min-h-11 w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors sm:min-h-0 {s.name ===
					currentScene
					? 'bg-accent-teal/10 text-accent-teal'
					: 'text-bloo-text hover:bg-bloo-card/60 focus-visible:bg-bloo-card/60'}"
				>
					<span
						class="inline-block size-2 shrink-0 rounded-full"
						style="background-color: {s.color}"
						aria-hidden="true"
					></span>
					<span class="truncate">{s.name}</span>
				</button>
			{/each}
		</div>{/if}</span>

<style>
	/* The trigger stays a single inline letter, but its hit area is a
	   44px square so it's actually tappable on a phone. */
	.scene-trigger {
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
	}
	.scene-trigger::before {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		width: 44px;
		height: 44px;
		transform: translate(-50%, -50%);
	}
</style>
