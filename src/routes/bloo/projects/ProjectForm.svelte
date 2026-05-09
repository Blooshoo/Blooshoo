<script lang="ts">
	interface Project {
		id?: string;
		title?: string;
		description?: string;
		category?: string;
		ownerType?: string;
		ownerId?: string;
		image?: string;
		links?: { label: string; url: string }[];
		featured?: boolean;
		sortOrder?: number;
	}

	let {
		project,
		action,
		error,
		users
	}: {
		project?: Project;
		action: string;
		error?: string;
		users?: { id: string; displayName: string }[];
	} = $props();

	let linksJson = $state(
		project?.links?.length ? JSON.stringify(project.links, null, 2) : '[]'
	);
</script>

<form method="POST" {action} class="space-y-6">
	{#if project?.id}
		<input type="hidden" name="id" value={project.id} />
	{/if}

	{#if error}
		<div class="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
			{error}
		</div>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2">
		<div class="space-y-2">
			<label class="label-caps" for="title">Title</label>
			<input
				id="title"
				name="title"
				type="text"
				required
				class="input-dark"
				value={project?.title ?? ''}
			/>
		</div>

		<div class="space-y-2">
			<label class="label-caps" for="category">Category</label>
			<input
				id="category"
				name="category"
				type="text"
				class="input-dark"
				value={project?.category ?? ''}
				placeholder="e.g. Web, Game, Tool"
			/>
		</div>
	</div>

	<div class="space-y-2">
		<label class="label-caps" for="description">Description</label>
		<textarea
			id="description"
			name="description"
			rows="3"
			class="input-dark resize-none"
			value={project?.description ?? ''}
		></textarea>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		<div class="space-y-2">
			<label class="label-caps" for="ownerType">Owner type</label>
			<select id="ownerType" name="ownerType" class="input-dark" value={project?.ownerType ?? 'mine'}>
				<option value="mine">Mine</option>
				<option value="friend">Friend</option>
				<option value="collab">Collab</option>
			</select>
		</div>

		{#if users && users.length > 0}
			<div class="space-y-2">
				<label class="label-caps" for="ownerId">Owner</label>
				<select id="ownerId" name="ownerId" class="input-dark" value={project?.ownerId ?? ''}>
					<option value="">Select user...</option>
					{#each users as user (user.id)}
						<option value={user.id}>{user.displayName}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>

	<div class="space-y-2">
		<label class="label-caps" for="image">Image URL</label>
		<input
			id="image"
			name="image"
			type="url"
			class="input-dark"
			value={project?.image ?? ''}
		/>
	</div>

	<div class="space-y-2">
		<label class="label-caps" for="links">Links (JSON array)</label>
		<textarea
			id="links"
			name="links"
			rows="4"
			class="input-dark resize-none font-mono text-xs"
			bind:value={linksJson}
			placeholder="Array of link objects with label and url fields"
		></textarea>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		<label class="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-3">
			<input
				type="checkbox"
				name="featured"
				value="true"
				class="rounded border-slate-600"
				checked={project?.featured ?? false}
			/>
			<span class="text-sm text-slate-300">Featured project</span>
		</label>

		<div class="space-y-2">
			<label class="label-caps" for="sortOrder">Sort order</label>
			<input
				id="sortOrder"
				name="sortOrder"
				type="number"
				class="input-dark"
				value={project?.sortOrder ?? 0}
			/>
		</div>
	</div>

	<div class="flex gap-3 pt-2">
		<button type="submit" class="btn-cyan">Save project</button>
		<a href="/bloo/projects" class="btn-ghost">Cancel</a>
	</div>
</form>
