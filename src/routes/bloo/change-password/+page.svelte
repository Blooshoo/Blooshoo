<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form } = $props<{ form: ActionData }>();
</script>

<svelte:head>
	<title>Change password — bloo</title>
</svelte:head>

<div class="max-w-md space-y-6">
	<h1 class="text-2xl font-bold text-slate-100" style="font-family: var(--font-heading)">
		Change password
	</h1>

	{#if form?.success}
		<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
			Password changed successfully.
		</div>
	{/if}

	{#if form?.error}
		<div class="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
			{form.error}
		</div>
	{/if}

	<form method="POST" use:enhance class="space-y-5">
		<div class="space-y-2">
			<label class="label-caps" for="currentPassword">Current password</label>
			<input
				id="currentPassword"
				name="currentPassword"
				type="password"
				required
				class="input-dark"
				autocomplete="current-password"
			/>
		</div>

		<div class="space-y-2">
			<label class="label-caps" for="newPassword">New password</label>
			<input
				id="newPassword"
				name="newPassword"
				type="password"
				required
				minlength="8"
				class="input-dark"
				autocomplete="new-password"
			/>
		</div>

		<div class="space-y-2">
			<label class="label-caps" for="confirmPassword">Confirm new password</label>
			<input
				id="confirmPassword"
				name="confirmPassword"
				type="password"
				required
				minlength="8"
				class="input-dark"
				autocomplete="new-password"
			/>
		</div>

		<button type="submit" class="btn-cyan">Change password</button>
	</form>
</div>
