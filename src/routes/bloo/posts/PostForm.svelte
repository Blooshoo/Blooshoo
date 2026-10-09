<script lang="ts">
	import { enhance } from '$app/forms';
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

	interface PostMedia {
		id: number;
		filename: string;
		originalName: string;
		url: string;
		mimeType: string;
	}

	let {
		post,
		media = [],
		action,
		error
	}: { post?: PostFormData; media?: PostMedia[]; action: string; error?: string } = $props();

	// These fields intentionally capture the server-loaded values once. Form edits should not be
	// overwritten by a parent prop update while an action response is being applied.
	// svelte-ignore state_referenced_locally
	const initialPost = post;
	let title = $state(initialPost?.title ?? '');
	let slug = $state(initialPost?.slug ?? '');
	let excerpt = $state(initialPost?.excerpt ?? '');
	let coverImage = $state(initialPost?.coverImage ?? '');
	let tagsInput = $state(initialPost?.tags?.join(', ') ?? '');
	let status = $state(initialPost?.status ?? 'draft');
	let content = $state(initialPost?.content ?? '');
	let saving = $state(false);

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
		if (!initialPost?.id) slug = generateSlug(val);
	}
</script>

<form
	method="POST"
	{action}
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update();
			saving = false;
		};
	}}
	class="space-y-6"
>
	{#if post?.id}
		<input type="hidden" name="id" value={post.id} />
	{/if}

	{#if error}
		<div
			id="post-form-error"
			role="alert"
			aria-live="polite"
			class="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400"
		>
			{error}
		</div>
	{/if}

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
		<p class="text-xs text-slate-500">The URL slug is generated from the title automatically.</p>
	</div>

	<div class="space-y-2">
		<div>
			<p class="label-caps">Content</p>
			<p class="mt-1 text-xs text-slate-500">Write the post here. Use the image button to insert an uploaded Media image.</p>
		</div>
		<RichTextEditor bind:content {media} />
	</div>

	<details class="rounded-lg border border-slate-800/60 bg-slate-900/30 px-4">
		<summary class="cursor-pointer list-none py-3 text-sm font-medium text-slate-300">
			Post details <span class="ml-2 text-xs font-normal text-slate-500">URL, preview, cover image, and tags</span>
		</summary>
		<div class="space-y-4 border-t border-slate-800/60 pb-4 pt-4">
			<div class="space-y-2">
				<label class="label-caps" for="slug">URL slug <span class="font-normal normal-case tracking-normal text-slate-500">(optional)</span></label>
				<input
					id="slug"
					name="slug"
					type="text"
					class="input-dark font-mono text-sm"
					aria-describedby="slug-help"
					bind:value={slug}
				/>
				<p id="slug-help" class="text-xs text-slate-500">The part after <span class="font-mono text-slate-400">/blog/</span>, for example <span class="font-mono text-slate-400">my-first-post</span>. Leave it alone unless you want a custom URL.</p>
			</div>

			<div class="space-y-2">
				<label class="label-caps" for="excerpt">Excerpt <span class="font-normal normal-case tracking-normal text-slate-500">(optional)</span></label>
				<textarea
					id="excerpt"
					name="excerpt"
					rows="2"
					class="input-dark resize-none"
					aria-describedby="excerpt-help"
					bind:value={excerpt}
				></textarea>
				<p id="excerpt-help" class="text-xs text-slate-500">Short preview text for the blog list and search engines. If blank, the first body text is used.</p>
			</div>

			<div class="space-y-2">
				<label class="label-caps" for="coverImage">Cover image URL <span class="font-normal normal-case tracking-normal text-slate-500">(optional)</span></label>
				<input
					id="coverImage"
					name="coverImage"
					type="url"
					class="input-dark"
					bind:value={coverImage}
				/>
			</div>

			<div class="space-y-2">
				<label class="label-caps" for="tags">Tags <span class="font-normal normal-case tracking-normal text-slate-500">(optional, comma-separated)</span></label>
				<input
					id="tags"
					name="tags"
					type="text"
					class="input-dark"
					bind:value={tagsInput}
					placeholder="svelte, web, tutorial"
				/>
			</div>
		</div>
	</details>

	<div class="flex flex-wrap items-end justify-between gap-4 border-t border-slate-800/60 pt-4">
		<div class="space-y-2">
			<label class="label-caps" for="status">Status</label>
			<select id="status" name="status" class="input-dark" bind:value={status}>
				<option value="draft">Draft</option>
				<option value="published">Published</option>
			</select>
		</div>
		<div class="flex gap-3">
		<button type="submit" class="btn-cyan" disabled={saving} aria-busy={saving}>
			{saving ? 'Saving…' : 'Save post'}
		</button>
		<a href="/bloo/posts" class="btn-ghost">Cancel</a>
		</div>
	</div>
</form>
