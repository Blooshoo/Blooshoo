<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { authClient } from '$lib/auth-client';
	import type { ActionData } from './$types';

	let { form } = $props<{ form: ActionData }>();

	let discordLoading = $state(false);
	let discordError = $state('');

	// Check for discord error from OAuth callback
	$effect(() => {
		if ($page.url.searchParams.get('error') === 'discord') {
			discordError = 'Discord sign-in failed. Please try again.';
		}
	});

	const discordIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>`;

	async function handleDiscordLogin() {
		discordError = '';
		discordLoading = true;
		try {
			await authClient.signIn.social({
				provider: 'discord',
				callbackURL: '/bloo',
				errorCallbackURL: '/bloo/login?error=discord'
			});
		} catch {
			discordError = 'Discord sign-in failed. Please try again.';
			discordLoading = false;
		}
	}
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

		{#if form?.error || discordError}
			<div
				class="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400"
			>
				{form?.error ?? discordError}
			</div>
		{/if}

		<button
			type="button"
			onclick={handleDiscordLogin}
			disabled={discordLoading}
			class="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#5865F2] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#4752C4] disabled:opacity-50"
		>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html discordIcon}
			{discordLoading ? 'Redirecting…' : 'Continue with Discord'}
		</button>

		<div class="relative my-5 flex items-center">
			<div class="flex-grow border-t border-slate-800"></div>
			<span class="mx-3 text-xs text-slate-600">or</span>
			<div class="flex-grow border-t border-slate-800"></div>
		</div>

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
