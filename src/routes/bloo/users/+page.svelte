<script lang="ts">
	import { enhance } from '$app/forms';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();

	let showCreateForm = $state(false);

	function formatDate(date: Date | string) {
		return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	}
</script>

<svelte:head>
	<title>Users — bloo</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-slate-100" style="font-family: var(--font-heading)">Users</h1>
		<button class="btn-cyan" onclick={() => (showCreateForm = !showCreateForm)}>
			{showCreateForm ? 'Cancel' : 'Add user'}
		</button>
	</div>

	{#if form?.error}
		<div class="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
			{form.error}
		</div>
	{/if}
	{#if form?.success}
		<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
			User created.
		</div>
	{/if}

	{#if showCreateForm}
		<div class="rounded-lg border border-slate-800/60 bg-slate-900/40 p-5">
			<h2 class="mb-4 text-sm font-semibold text-slate-300">New user</h2>
			<form method="POST" action="?/createUser" use:enhance class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<label class="label-caps" for="email">Email</label>
					<input id="email" name="email" type="email" required class="input-dark" />
				</div>
				<div class="space-y-2">
					<label class="label-caps" for="username">Username</label>
					<input id="username" name="username" type="text" required class="input-dark" />
				</div>
				<div class="space-y-2">
					<label class="label-caps" for="displayName">Display name</label>
					<input id="displayName" name="displayName" type="text" class="input-dark" />
				</div>
				<div class="space-y-2">
					<label class="label-caps" for="password">Password</label>
					<input id="password" name="password" type="password" required minlength="8" class="input-dark" />
				</div>
				<div class="space-y-2">
					<label class="label-caps" for="role">Role</label>
					<select id="role" name="role" class="input-dark">
						<option value="contributor">Contributor</option>
						<option value="admin">Admin</option>
					</select>
				</div>
				<div class="flex items-end">
					<button type="submit" class="btn-cyan">Create user</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="overflow-hidden rounded-lg border border-slate-800/60">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-slate-800/60 bg-slate-900/60 text-left">
					<th class="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">User</th>
					<th class="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 sm:table-cell">Email</th>
					<th class="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Role</th>
					<th class="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 md:table-cell">Joined</th>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody>
				{#each data.users as user (user.id)}
					<tr class="border-b border-slate-800/40 last:border-0">
						<td class="px-4 py-3">
							<p class="font-medium text-slate-200">{user.displayName}</p>
							<p class="text-xs text-slate-500">@{user.username}</p>
						</td>
						<td class="hidden px-4 py-3 text-slate-400 sm:table-cell">{user.email}</td>
						<td class="px-4 py-3">
							<StatusBadge status={user.role} />
						</td>
						<td class="hidden px-4 py-3 text-slate-500 md:table-cell">{formatDate(user.createdAt)}</td>
						<td class="px-4 py-3 text-right">
							<form method="POST" action="?/deleteUser" use:enhance>
								<input type="hidden" name="id" value={user.id} />
								<button
									type="submit"
									class="text-xs text-red-400 hover:text-red-300"
									onclick={(e) => {
										if (!confirm('Delete this user?')) e.preventDefault();
									}}
								>
									Delete
								</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
