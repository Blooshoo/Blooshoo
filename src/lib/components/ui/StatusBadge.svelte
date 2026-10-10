<script lang="ts">
	const statusConfig: Record<
		string,
		{ label: string; classes: string }
	> = {
		published: { label: 'Published', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
		draft: { label: 'Draft', classes: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
		unread: { label: 'Unread', classes: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
		read: { label: 'Read', classes: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
		replied: { label: 'Replied', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
		admin: { label: 'Admin', classes: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30' },
		contributor: { label: 'Contributor', classes: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' }
	};

	let { status } = $props<{ status: string }>();

	const config = $derived(
		statusConfig[status] ?? {
			label: status,
			classes: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
		}
	);
</script>

<span
	class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium {config.classes}"
>
	{config.label}
</span>
