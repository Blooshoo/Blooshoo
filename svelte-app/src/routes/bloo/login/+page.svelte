<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form } = $props<{ form: ActionData }>();
</script>

<svelte:head>
	<title>Login — bloo</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-slate-950 px-4">
	<div
		class="w-full max-w-sm rounded-xl border border-slate-800/60 bg-slate-900/60 p-8 shadow-login-card backdrop-blur"
	>
		<div class="mb-8 text-center">
			<h1
				class="logo-glitch text-2xl font-bold"
				style="font-family: var(--font-heading)"
				data-text="bloo"
			>
				bloo
			</h1>
			<p class="mt-1 text-sm text-slate-500">Sign in to continue</p>
		</div>

		{#if form?.error}
			<div
				class="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400"
			>
				{form.error}
			</div>
		{/if}

		<form use:enhance method="POST" class="space-y-5">
			<div class="space-y-2">
				<label class="label-caps" for="email">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					class="input-dark"
					placeholder="you@example.com"
					autocomplete="email"
				/>
			</div>

			<div class="space-y-2">
				<label class="label-caps" for="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					class="input-dark"
					placeholder="••••••••"
					autocomplete="current-password"
				/>
			</div>

			<button type="submit" class="btn-cyan w-full justify-center">Sign in</button>
		</form>
	</div>
</div>
