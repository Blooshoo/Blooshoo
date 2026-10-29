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

	// SvelteKit fills in generic messages ("Not Found" for unknown routes,
	// "Internal Error" for unexpected throws). Those get the friendly copy;
	// a message deliberately passed to error(), like "Project not found", wins.
	const genericMessages = new Set([
		'Not Found',
		'Internal Error',
		'Internal Server Error',
		'Forbidden',
		'Service Unavailable',
		'Error'
	]);
	const message = $derived.by(() => {
		const raw = $page.error?.message?.trim();
		return raw && !genericMessages.has(raw) ? raw : label.subtitle;
	});

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

		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

		function update(dt: number) {
			if (state.kind === '404') updateGlitch404(state, dt);
			else if (state.kind === '500') updateExplosion500(state, dt);
			else if (state.kind === '403') updateForbidden403(state, dt);
			else if (state.kind === '503') updateSleep503(state, dt);
		}

		function draw() {
			if (state.kind === '404') drawGlitch404(state, ctx);
			else if (state.kind === '500') drawExplosion500(state, ctx);
			else if (state.kind === '403') drawForbidden403(state, ctx);
			else if (state.kind === '503') drawSleep503(state, ctx);
		}

		// Reduced motion: fast-forward the scene a few seconds so it has
		// something on screen, then paint that single still frame.
		function drawStill() {
			initState();
			for (let i = 0; i < 80; i++) update(0.05);
			if (state.kind === '404') {
				// The skyline normally redraws forever; freeze it nearly complete
				// and calm, rather than wherever the random walk happened to be.
				state.lineIdx = state.segments.length - 1;
				state.lineProgress = 0.95;
				state.glitchIntensity = 0.2;
			}
			draw();
		}

		function tick(time: number) {
			animId = requestAnimationFrame(tick);
			const dt = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1000, 0.1);
			lastTime = time;
			update(dt);
			draw();
		}

		function start() {
			cancelAnimationFrame(animId);
			lastTime = 0;
			if (motionQuery.matches) {
				drawStill();
			} else {
				animId = requestAnimationFrame(tick);
			}
		}

		function onResize() {
			resize();
			if (motionQuery.matches) drawStill();
		}

		resize();
		initState();
		window.addEventListener('resize', onResize);
		motionQuery.addEventListener('change', start);
		start();

		return () => {
			window.removeEventListener('resize', onResize);
			motionQuery.removeEventListener('change', start);
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
			{message}
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
