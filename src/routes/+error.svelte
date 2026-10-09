<script lang="ts">
	import { page } from '$app/stores';
	import {
		createGlitch404, updateGlitch404, drawGlitch404,
		createExplosion500, updateExplosion500, drawExplosion500,
		createForbidden403, updateForbidden403, drawForbidden403,
		createSleep503, updateSleep503, drawSleep503,
		type Glitch404State,
		type Explosion500State,
		type Forbidden403State,
		type Sleep503State,
	} from '$lib/scenes/error-scenes';

	type AnyErrorState = Glitch404State | Explosion500State | Forbidden403State | Sleep503State;

	const status = $derived($page.status);

	const labels: Record<number, { title: string; subtitle: string }> = {
		404: { title: '404', subtitle: "whatever you're looking for isn't here (or never was)" },
		500: { title: '500', subtitle: 'something broke on my end — probably my fault, sorry' },
		403: { title: '403', subtitle: "you're not allowed in here" },
		503: { title: '503', subtitle: "the server's having a little nap, try again in a bit" },
	};
	const label = $derived(labels[status] ?? { title: String(status), subtitle: 'something went wrong' });

	const sceneColor = $derived(
		status === 403 ? '#ff2244' :
		status === 500 ? '#ff6600' :
		status === 503 ? '#8866cc' :
		'#00ffcc'
	);
	const sceneColorDim = $derived(
		status === 403 ? 'rgba(255,34,68,0.3)' :
		status === 500 ? 'rgba(255,102,0,0.3)' :
		status === 503 ? 'rgba(136,102,204,0.3)' :
		'rgba(0,255,204,0.3)'
	);

	let canvas: HTMLCanvasElement;

	$effect(() => {
		if (!canvas) return;
		const ctxOrNull = canvas.getContext('2d');
		if (!ctxOrNull) return;
		const ctx: CanvasRenderingContext2D = ctxOrNull;

		let w = 0;
		let h = 0;
		let animId = 0;
		let lastTime = 0;

		let state: AnyErrorState;

		function initState() {
			if (status === 500) state = createExplosion500(w, h);
			else if (status === 403) state = createForbidden403(w, h);
			else if (status === 503) state = createSleep503(w, h);
			else state = createGlitch404(w, h);
		}

		function resize() {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			w = window.innerWidth;
			h = window.innerHeight;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			if (state) {
				state.w = w;
				state.h = h;
			}
		}

		function tick(time: number) {
			animId = requestAnimationFrame(tick);
			const dt = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1000, 0.1);
			lastTime = time;

			if (state.kind === '404') {
				updateGlitch404(state, dt);
				drawGlitch404(state, ctx);
			} else if (state.kind === '500') {
				updateExplosion500(state, dt);
				drawExplosion500(state, ctx);
			} else if (state.kind === '403') {
				updateForbidden403(state, dt);
				drawForbidden403(state, ctx);
			} else if (state.kind === '503') {
				updateSleep503(state, dt);
				drawSleep503(state, ctx);
			}
		}

		resize();
		initState();
		window.addEventListener('resize', resize);
		animId = requestAnimationFrame(tick);

		return () => {
			window.removeEventListener('resize', resize);
			cancelAnimationFrame(animId);
		};
	});
</script>

<svelte:head>
	<title>{label.title} — blooshoo</title>
</svelte:head>

<canvas bind:this={canvas} class="fixed inset-0 z-0" aria-hidden="true"></canvas>

<div class="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
	<div class="space-y-4">
		<p
			class="text-[7rem] font-bold leading-none tabular-nums sm:text-[10rem]"
			style="font-family: var(--font-heading); color: {sceneColor}; text-shadow: 0 0 40px {sceneColor}, 0 0 80px {sceneColorDim};"
		>
			{label.title}
		</p>
		<p class="max-w-sm text-sm text-bloo-muted sm:text-base">
			{$page.error?.message && $page.error.message !== label.subtitle
				? $page.error.message
				: label.subtitle}
		</p>
		<a
			href="/"
			class="inline-block rounded border px-4 py-2 text-sm transition-colors hover:bg-bloo-card/40"
			style="border-color: {sceneColor}; color: {sceneColor};"
		>
			← go home
		</a>
	</div>
</div>

<style>
	canvas {
		display: block;
	}
</style>
