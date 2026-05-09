---
description: 'Use when creating, editing, or organizing Svelte components. Enforces folder structure, naming, prop typing, and composition conventions for src/lib/components/.'
applyTo: 'src/lib/components/**/*.svelte'
---

# Component Conventions

## Folder Structure

```
src/lib/components/
  ui/       ← Generic, reusable UI primitives (no business logic)
  layout/   ← Structural shell components (Sidebar, Topbar)
  auth/     ← Auth-specific components
```

Place new components in the most specific folder:

- If it's a general-purpose display or form element → `ui/`
- If it's a page-level structural shell → `layout/`
- If it requires auth context → `auth/`
- Do **not** create new folders without a clear category need

## Naming

- Files: **PascalCase** — `SectionCard.svelte`, `StatusBadge.svelte`
- One component per file
- Name reflects what it **is**, not what it **does**: `StatCard` not `DisplayStat`

## Imports

Always import from the full `$lib/components/...` path — do not use relative paths from within `src/`:

```ts
// ✅
import SectionCard from '$lib/components/ui/SectionCard.svelte';

// ❌
import SectionCard from '../components/ui/SectionCard.svelte';
```

## Props

Type props inline using `$props<{...}>()` — do not use a separate `interface` or `type` alias unless it's shared across multiple components:

```svelte
<script lang="ts">
	let {
		title,
		description = undefined,
		children
	} = $props<{
		title: string;
		description?: string;
		children: Snippet;
	}>();
</script>
```

- Optional props must have a default value (`= undefined` or a real default)
- Use `Snippet` from `'svelte'` for composable markup slots
- Use `Snippet<[T]>` for typed render props (e.g., row renderers in `DataTable`)

## Composition: Snippets over Slots

Accept content via `Snippet` props. Common pattern:

```svelte
<!-- SectionCard: accepts children + optional headerAction -->
{#if headerAction}
	{@render headerAction()}
{/if}
{@render children()}
```

Named snippets in the consumer:

```svelte
{#snippet headerAction()}
	<button class="btn-ghost">Export</button>
{/snippet}

<SectionCard title="Movies" {headerAction}>
	<!-- body -->
</SectionCard>
```

## Existing UI Components (use before creating new ones)

| Component     | Purpose                             | Key Props                                            |
| ------------- | ----------------------------------- | ---------------------------------------------------- |
| `PageHeader`  | Page title + subtitle               | `title`, `description?`                              |
| `SectionCard` | Titled card panel with header/body  | `title`, `description?`, `headerAction?`, `children` |
| `StatCard`    | Metric card with value, icon, trend | `title`, `value`, `icon?`, `trend?`                  |
| `DataTable`   | Generic data table                  | `columns`, `data`, `rowSnippet`                      |
| `EmptyState`  | Empty/zero-state placeholder        | `title`, `message`, `actionLabel?`                   |
| `StatusBadge` | Inline status indicator             | varies                                               |

Check this folder before building a new component that might already exist.

## Visual Style

All `ui/` components follow the dark admin aesthetic — see `tailwindcss.instructions.md` for token and color conventions. Key structural patterns used in existing components:

```svelte
<!-- Standard card shell -->
<div
	class="group relative overflow-hidden rounded-none border-2 border-slate-700
            bg-slate-900/80 shadow-card backdrop-blur-md"
>
	<!-- Hover top glow line -->
	<div
		class="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent
              via-cyan-500/20 to-transparent transition-all duration-500
              group-hover:via-cyan-400/40"
	></div>
	...
</div>
```

- `rounded-none` — square corners are the design language
- `border-2 border-slate-700` — standard card border weight
- `shadow-card` — defined in `@theme`, always use the token
- `backdrop-blur-md` — frosted glass on card surfaces
