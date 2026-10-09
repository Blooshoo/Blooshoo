<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();

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
	</div>

	{#if form?.error}
		<div class="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
			{form.error}
		</div>
	{/if}
	{#if form?.success}
		<div class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
			{form.message ?? 'Updated.'}
		</div>
	{/if}

	<section class="rounded-lg border border-slate-800/60 bg-slate-900/30 p-5">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h2 class="font-semibold text-slate-100">Discord access</h2>
				<p class="mt-1 max-w-2xl text-sm text-slate-500">
					Only authorised Discord IDs can sign in. Removing an ID also signs that user out; their
					profile stays here in case you add them again later.
				</p>
			</div>
			<span class="rounded-full border border-accent-teal/30 bg-accent-teal/10 px-2.5 py-1 text-xs text-accent-teal">
				Owner protected
			</span>
		</div>

		{#if data.canManageDiscordIds}
			<form method="POST" action="?/addDiscordId" use:enhance class="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end">
				<label class="flex-1 text-xs font-medium uppercase tracking-wider text-slate-500">
					<span class="mb-2 block">Discord user ID</span>
					<input
						name="discordId"
						inputmode="numeric"
						pattern={'[0-9]{17,20}'}
						maxlength="20"
						required
						placeholder="123456789012345678"
						class="input-dark w-full rounded-md px-3 py-2 text-sm normal-case tracking-normal"
					/>
				</label>
				<button type="submit" class="rounded-md bg-accent-teal px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-300">
					Authorise ID
				</button>
			</form>
			<p class="mt-2 text-xs text-slate-600">
				Enable Developer Mode in Discord, then right-click a user and choose Copy User ID.
			</p>
		{:else}
			<p class="mt-4 text-xs text-amber-300/80">
				Only the configured owner can add or remove Discord IDs.
			</p>
		{/if}

		<div class="mt-5 overflow-x-auto rounded-md border border-slate-800/60">
			<table class="w-full min-w-[34rem] text-sm">
				<thead>
					<tr class="border-b border-slate-800/60 bg-slate-950/30 text-left">
						<th class="px-3 py-2 text-xs font-medium uppercase tracking-wider text-slate-500">Discord ID</th>
						<th class="px-3 py-2 text-xs font-medium uppercase tracking-wider text-slate-500">Linked account</th>
						<th class="px-3 py-2 text-xs font-medium uppercase tracking-wider text-slate-500">Added</th>
						<th class="px-3 py-2"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.allowedDiscordIds as entry (entry.discordId)}
						<tr class="border-b border-slate-800/40 last:border-0">
							<td class="px-3 py-2 font-mono text-xs text-slate-300">
								{entry.discordId}
								{#if entry.discordId === data.ownerDiscordId}
									<span class="ml-1 font-sans text-[10px] text-accent-teal">owner</span>
								{/if}
							</td>
							<td class="px-3 py-2 text-slate-400">
								{entry.linkedDisplayName ?? 'Not signed in yet'}
								{#if entry.linkedUsername}
									<span class="text-xs text-slate-600">@{entry.linkedUsername}</span>
								{/if}
							</td>
							<td class="px-3 py-2 text-xs text-slate-500">{formatDate(entry.addedAt)}</td>
							<td class="px-3 py-2 text-right">
								{#if data.canManageDiscordIds && entry.discordId !== data.ownerDiscordId}
									<form method="POST" action="?/removeDiscordId" use:enhance>
										<input type="hidden" name="discordId" value={entry.discordId} />
										<button
											type="submit"
											class="text-xs text-red-400 hover:text-red-300"
											onclick={(e) => {
												if (!confirm('Remove this Discord ID and sign them out?')) e.preventDefault();
											}}
										>
											Remove
										</button>
									</form>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<p class="text-sm text-slate-500">
		User profiles are created automatically when they first sign in with Discord. The first user
		becomes admin.
	</p>

	<div class="overflow-hidden rounded-lg border border-slate-800/60">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-slate-800/60 bg-slate-900/60 text-left">
					<th class="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">User</th>
					<th class="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 sm:table-cell">Email</th>
					<th class="hidden px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 lg:table-cell">Discord ID</th>
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
						<td class="hidden px-4 py-3 font-mono text-xs text-slate-500 lg:table-cell">{user.discordId ?? '—'}</td>
						<td class="px-4 py-3">
							<form method="POST" action="?/updateRole" use:enhance class="flex items-center gap-1">
								<input type="hidden" name="id" value={user.id} />
								<select
									name="role"
									value={user.role}
									class="input-dark rounded px-2 py-1 text-xs"
									aria-label="Role for {user.displayName}"
								>
									<option value="contributor">Contributor</option>
									<option value="admin">Admin</option>
								</select>
								<button type="submit" class="text-xs text-accent-teal hover:text-teal-300">
									Save
								</button>
							</form>
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
