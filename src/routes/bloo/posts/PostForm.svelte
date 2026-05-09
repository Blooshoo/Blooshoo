<script lang="ts">
	import RichTextEditor from '$lib/components/ui/RichTextEditor.svelte';

	interface PostFormData {
		id?: string;
		title?: string;
		slug?: string;
		content?: string;
		excerpt?: string;
		coverImage?: string;
		tags?: string[];
		status?: string;
	}

	let { post, action, error }: { post?: PostFormData; action: string; error?: string } = $props();

	let title = $state(post?.title ?? '');
	let slug = $state(post?.slug ?? '');
	let excerpt = $state(post?.excerpt ?? '');
	let coverImage = $state(post?.coverImage ?? '');
	let tagsInput = $state(post?.tags?.join(', ') ?? '');
	let status = $state(post?.status ?? 'draft');
	let content = $state(post?.content ?? '');

	// Auto-generate slug from title
	function generateSlug(value: string) {
		return value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}

	function handleTitleInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		title = val;
		if (!post?.id) slug = generateSlug(val);
	}
</script>

<form method="POST" {action} class="space-y-6">
	{#if post?.id}
		<input type="hidden" name="id" value={post.id} />
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
				value={title}
				oninput={handleTitleInput}
			/>
		</div>

		<div class="space-y-2">
			<label class="label-caps" for="slug">Slug</label>
			<input
				id="slug"
				name="slug"
				type="text"
				required
				class="input-dark font-mono text-sm"
				bind:value={slug}
			/>
		</div>
	</div>

	<div class="space-y-2">
		<label class="label-caps" for="excerpt">Excerpt</label>
		<textarea
			id="excerpt"
			name="excerpt"
			rows="2"
			class="input-dark resize-none"
			bind:value={excerpt}
		></textarea>
	</div>

	<div class="space-y-2">
		<label class="label-caps" for="coverImage">Cover image URL</label>
		<input
			id="coverImage"
			name="coverImage"
			type="url"
			class="input-dark"
			bind:value={coverImage}
		/>
	</div>

	<div class="space-y-2">
		<p class="label-caps">Content</p>
		<RichTextEditor bind:content />
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		<div class="space-y-2">
			<label class="label-caps" for="tags">Tags (comma-separated)</label>
			<input
				id="tags"
				name="tags"
				type="text"
				class="input-dark"
				bind:value={tagsInput}
				placeholder="svelte, web, tutorial"
			/>
		</div>

		<div class="space-y-2">
			<label class="label-caps" for="status">Status</label>
			<select id="status" name="status" class="input-dark" bind:value={status}>
				<option value="draft">Draft</option>
				<option value="published">Published</option>
			</select>
		</div>
	</div>

	<div class="flex gap-3 pt-2">
		<button type="submit" class="btn-cyan">Save post</button>
		<a href="/bloo/posts" class="btn-ghost">Cancel</a>
	</div>
</form>
