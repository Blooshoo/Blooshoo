<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Color from '@tiptap/extension-color';
	import { TextStyle } from '@tiptap/extension-text-style';
	import LinkExtension from '@tiptap/extension-link';
	import ImageExtension from '@tiptap/extension-image';

	// ---- Icons (Lucide SVG strings) ----
	const boldIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bold"><path d="M14 12a4 4 0 0 0 0-8H6v8"/><path d="M15 20a4 4 0 0 0 0-8H6v8Z"/></svg>`;
	const italicIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-italic"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>`;
	const h1Icon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heading-1"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/></svg>`;
	const h2Icon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heading-2"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>`;
	const listIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>`;
	const listOrderedIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-ordered"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>`;
	const linkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
	const imageIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;

	// ---- Props ----
	let { content = $bindable('') }: { content?: string } = $props();

	// ---- State ----
	let editorEl = $state<HTMLDivElement>();
	let editor = $state<Editor | undefined>(undefined);
	let isReady = $state(false);

	// link popover
	let showLinkInput = $state(false);
	let linkUrl = $state('');
	// image popover
	let showImageInput = $state(false);
	let imageUrl = $state('');

	// Active state — updated whenever the editor state changes
	let isBold = $state(false);
	let isItalic = $state(false);
	let isH1 = $state(false);
	let isH2 = $state(false);
	let isBullet = $state(false);
	let isOrdered = $state(false);
	let isLink = $state(false);

	function syncActiveStates() {
		if (!editor) return;
		isBold = editor.isActive('bold');
		isItalic = editor.isActive('italic');
		isH1 = editor.isActive('heading', { level: 1 });
		isH2 = editor.isActive('heading', { level: 2 });
		isBullet = editor.isActive('bulletList');
		isOrdered = editor.isActive('orderedList');
		isLink = editor.isActive('link');
	}

	// ---- Lifecycle ----
	onMount(() => {
		if (!editorEl) return;

		const instance = new Editor({
			element: editorEl,
			extensions: [
				StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
				Color,
				TextStyle,
				LinkExtension.configure({
					openOnClick: true,
					HTMLAttributes: { class: 'text-cyan-400 underline hover:text-accent-teal transition-colors' }
				}),
				ImageExtension.configure({
					HTMLAttributes: { class: 'max-w-full rounded-lg' }
				})
			],
			content,
			editorProps: {
				attributes: {
					class: 'prose prose-invert max-w-none min-h-80 px-4 py-3 focus:outline-none text-slate-200 font-mono text-sm leading-relaxed'
				}
			},
			onUpdate({ editor: e }) {
				content = e.getHTML();
				syncActiveStates();
			},
			onSelectionUpdate() {
				syncActiveStates();
			},
			onTransaction() {
				syncActiveStates();
			}
		});

		editor = instance;
		isReady = true;
	});

	onDestroy(() => {
		editor?.destroy();
	});

	// ---- Actions ----
	function setLink() {
		if (!editor || !linkUrl) return;
		editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
		linkUrl = '';
		showLinkInput = false;
	}

	function addImage() {
		if (!editor || !imageUrl) return;
		editor.chain().focus().setImage({ src: imageUrl }).run();
		imageUrl = '';
		showImageInput = false;
	}

	function btnClass(active: boolean) {
		return `p-1.5 rounded text-xs transition-colors ${active ? 'bg-cyan-400 text-slate-900' : 'text-slate-200 hover:bg-cyan-400/10'}`;
	}
</script>

<div class="overflow-hidden rounded-lg border border-cyan-400/15 bg-slate-950">
	{#if !isReady}
		<div class="flex min-h-80 items-center justify-center text-sm text-slate-500">
			Loading editor…
		</div>
	{/if}

	<!-- Toolbar -->
	{#if isReady && editor}
		<div class="flex flex-wrap items-center gap-0.5 border-b border-cyan-400/10 bg-cyan-400/3 px-2 py-1.5">
			<!-- Bold -->
			<button type="button" class={btnClass(isBold)} title="Bold"
				onclick={() => editor?.chain().focus().toggleBold().run()}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html boldIcon}
			</button>

			<!-- Italic -->
			<button type="button" class={btnClass(isItalic)} title="Italic"
				onclick={() => editor?.chain().focus().toggleItalic().run()}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html italicIcon}
			</button>

			<span class="mx-0.5 h-4 w-px bg-cyan-400/15"></span>

			<!-- H1 -->
			<button type="button" class={btnClass(isH1)} title="Heading 1"
				onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html h1Icon}
			</button>

			<!-- H2 -->
			<button type="button" class={btnClass(isH2)} title="Heading 2"
				onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html h2Icon}
			</button>

			<span class="mx-0.5 h-4 w-px bg-cyan-400/15"></span>

			<!-- Bullet List -->
			<button type="button" class={btnClass(isBullet)} title="Bullet list"
				onclick={() => editor?.chain().focus().toggleBulletList().run()}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html listIcon}
			</button>

			<!-- Ordered List -->
			<button type="button" class={btnClass(isOrdered)} title="Ordered list"
				onclick={() => editor?.chain().focus().toggleOrderedList().run()}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html listOrderedIcon}
			</button>

			<span class="mx-0.5 h-4 w-px bg-cyan-400/15"></span>

			<!-- Link -->
			<button type="button" class={btnClass(isLink)} title="Link"
				onclick={() => {
					linkUrl = editor?.getAttributes('link').href ?? '';
					showLinkInput = true;
					showImageInput = false;
				}}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html linkIcon}
			</button>

			<!-- Image -->
			<button type="button" class={btnClass(false)} title="Image"
				onclick={() => {
					imageUrl = '';
					showImageInput = true;
					showLinkInput = false;
				}}>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html imageIcon}
			</button>

			<span class="mx-0.5 h-4 w-px bg-cyan-400/15"></span>

			<!-- Color picker -->
			<input
				type="color"
				class="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
				title="Text color"
				oninput={(e) => editor?.chain().focus().setColor(e.currentTarget.value).run()}
			/>
		</div>

		<!-- Link popover -->
		{#if showLinkInput}
			<div class="flex items-center gap-2 border-b border-cyan-400/8 bg-cyan-400/4 px-2 py-1.5">
				<input
					type="url"
					bind:value={linkUrl}
					placeholder="https://..."
					class="h-7 flex-1 rounded border border-cyan-400/20 bg-slate-950 px-2 font-mono text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"

					onkeydown={(e) => {
						if (e.key === 'Enter') { e.preventDefault(); setLink(); }
						if (e.key === 'Escape') { showLinkInput = false; linkUrl = ''; }
					}}
				/>
				<button type="button"
					class="rounded border border-cyan-400/30 px-2 py-0.5 font-mono text-xs text-cyan-400 transition-colors hover:bg-cyan-400 hover:text-slate-900"
					onclick={setLink}>Set</button>
				<button type="button" class="text-xs text-slate-500 hover:text-slate-200"
					onclick={() => { showLinkInput = false; linkUrl = ''; }}>✕</button>
			</div>
		{/if}

		<!-- Image popover -->
		{#if showImageInput}
			<div class="flex items-center gap-2 border-b border-cyan-400/8 bg-cyan-400/4 px-2 py-1.5">
				<input
					type="url"
					bind:value={imageUrl}
					placeholder="https://example.com/image.jpg"
					class="h-7 flex-1 rounded border border-cyan-400/20 bg-slate-950 px-2 font-mono text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"

					onkeydown={(e) => {
						if (e.key === 'Enter') { e.preventDefault(); addImage(); }
						if (e.key === 'Escape') { showImageInput = false; imageUrl = ''; }
					}}
				/>
				<button type="button"
					class="rounded border border-cyan-400/30 px-2 py-0.5 font-mono text-xs text-cyan-400 transition-colors hover:bg-cyan-400 hover:text-slate-900"
					onclick={addImage}>Add</button>
				<button type="button" class="text-xs text-slate-500 hover:text-slate-200"
					onclick={() => { showImageInput = false; imageUrl = ''; }}>✕</button>
			</div>
		{/if}
	{/if}

	<!-- Editor mount point -->
	<div bind:this={editorEl}></div>
</div>

<!-- Hidden input to submit content in a form -->
<input type="hidden" name="content" value={content} />
