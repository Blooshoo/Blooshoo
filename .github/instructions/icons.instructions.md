---
description: "Use when adding icons to components or pages. Enforces the Lucide SVG string pattern used across this project — covers how to define, pass, and render icons."
applyTo: "src/**/*.svelte", "src/**/*.ts"
---

# Icon Usage

## Pattern: Lucide SVG Strings

Icons are **raw SVG strings** sourced from [Lucide](https://lucide.dev/icons/) and passed as `string` props or rendered with `{@html}`. There is no icon component or icon library import.

### Defining an Icon

Declare SVG strings as `const` variables in `<script>`. Always include:

- `xmlns`, `width`, `height`, `viewBox="0 0 24 24"`
- `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`
- `class="lucide lucide-<name>"` on the `<svg>` element

```ts
const refreshIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`;
```

Copy the SVG path data verbatim from the [Lucide icons site](https://lucide.dev/icons/) — do not hand-write path data.

### Rendering with `{@html}`

When rendering an icon string directly in a template, always use `{@html}`:

```svelte
<!-- ✅ with ESLint suppression comment -->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html icon}
```

The ESLint suppression is required because `svelte/no-at-html-tags` is enabled. Only suppress the specific line — never disable the rule for a whole file.

### Passing Icons as Props

Components that accept icons expect `icon?: string`:

```svelte
<script lang="ts">
	let {
		title,
		value,
		icon = undefined
	} = $props<{
		title: string;
		value: string | number;
		icon?: string;
	}>();
</script>

{#if icon}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html icon}
{/if}
```

At the call site:

```svelte
<StatCard title="Bot Status" value="Online" icon={activityIcon} />
```

### Inline Icons (in templates)

For one-off icons that don't need to be passed as props, write the `<svg>` inline directly in the template — no `{@html}` needed:

```svelte
<svg
	xmlns="http://www.w3.org/2000/svg"
	width="24"
	height="24"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class="lucide lucide-ghost text-slate-400"
>
	<path d="M9 10h.01" />
	<path d="M15 10h.01" />
	<path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
</svg>
```

### Styling Icons

Apply color and glow via Tailwind classes on the icon's **wrapping element** or directly in the SVG string's `class` attribute:

```svelte
<!-- Wrapper approach (for {@html} icons) -->
<span class="text-cyan-400 drop-shadow-glow-cyan-soft transition-transform duration-300 group-hover:scale-110">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html icon}
</span>

<!-- Inline SVG: add classes directly -->
<svg class="lucide lucide-refresh-cw text-slate-400 transition-colors duration-300
            group-hover:text-cyan-400 group-hover:drop-shadow-glow-cyan-md" ...>
```

Always use `drop-shadow-glow-*` tokens from `@theme` for glow effects — never inline `drop-shadow-[...]` arbitrary values.

## Icon Size Conventions

| Context                        | `width`/`height` |
| ------------------------------ | ---------------- |
| Stat card / feature card icons | `20`             |
| Empty state / decorative       | `24`             |
| Inline text / badge            | `16`             |
