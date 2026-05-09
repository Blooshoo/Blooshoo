---
description: 'Use when writing or editing Svelte components, reactive state, props, effects, or event handlers. Enforces Svelte 5 runes syntax and forbids legacy Svelte 4 patterns.'
applyTo: '**/*.svelte'
---

# Svelte 5 Rules

## Always Use Runes

| Need                  | Use                      | Never                             |
| --------------------- | ------------------------ | --------------------------------- |
| Local state           | `$state()`               | `let x = 1` (mutable)             |
| Computed value        | `$derived(expr)`         | `$: x = expr`                     |
| Side effects          | `$effect(() => { ... })` | `onMount` (unless cleanup needed) |
| Component props       | `let { x } = $props()`   | `export let x`                    |
| Two-way bindable prop | `$bindable()`            | —                                 |

```svelte
<script lang="ts">
	let { label, value = $bindable('') }: { label: string; value?: string } = $props();
	let upper = $derived(value.toUpperCase());
</script>
```

## Event Handlers

Use direct HTML event attributes — not `on:` directive syntax.

```svelte
<!-- ✅ -->
<button onclick={handleClick}>Click</button>
<input oninput={(e) => (search = e.currentTarget.value)} />

<!-- ❌ -->
<button on:click={handleClick}>Click</button>
```

## Composition: Snippets over Slots

```svelte
<!-- ✅ -->
{#snippet row(item)}
	<tr><td>{item.name}</td></tr>
{/snippet}
{@render row(movie)}

<!-- ❌ -->
<slot name="row" />
```

To accept snippets as props: `let { children } = $props()` + `{@render children()}`.

## Cross-Component State

- Prefer `setContext` / `getContext` for tree-scoped state
- Use `.svelte.ts` modules (with `$state` at module scope) for global/shared reactive state
- Avoid `svelte/store` (`writable`, `readable`, `derived`) in new code

## Always

- `<script lang="ts">` on every component
- Prefer `$derived` over `$effect` for computed values — `$effect` is for DOM/third-party side effects only
