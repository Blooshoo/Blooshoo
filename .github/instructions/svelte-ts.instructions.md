---
description: 'Use when writing or editing .svelte.ts reactive state modules. Enforces Svelte 5 runes-based shared state patterns and forbids svelte/store primitives.'
applyTo: '**/*.svelte.ts'
---

# Svelte Reactive Module Rules (`.svelte.ts`)

Use `.svelte.ts` files for **global or cross-tree shared reactive state** that needs to be accessed outside of a component hierarchy. For state scoped to a component subtree, prefer `setContext` / `getContext` instead.

## Module-Scope State

Declare `$state` at module scope to create a reactive singleton. Export a factory function or a plain object with getter/setter methods — not the raw `$state` variable, which would allow callers to reassign it.

```ts
// ✅ src/lib/state/movies.svelte.ts
const _state = $state({ list: [] as Movie[], loading: false });

export const moviesStore = {
	get list() {
		return _state.list;
	},
	get loading() {
		return _state.loading;
	},
	set(movies: Movie[]) {
		_state.list = movies;
	},
	setLoading(v: boolean) {
		_state.loading = v;
	}
};
```

```ts
// ❌ — callers can do `list = []` bypassing reactivity
export let list = $state<Movie[]>([]);
```

## Derived State

Use `$derived` at module scope for computed values:

```ts
const _state = $state({ list: [] as Movie[], search: '' });

export const filtered = $derived(_state.list.filter((m) => m.title.includes(_state.search)));
```

## Never Use svelte/store

Do not use `writable`, `readable`, or `derived` from `svelte/store` in new code.

| Instead of               | Use                                            |
| ------------------------ | ---------------------------------------------- |
| `writable(value)`        | `$state(value)` in a `.svelte.ts` module       |
| `derived(store, fn)`     | `$derived(fn)` in a `.svelte.ts` module        |
| `readable(value, start)` | `$state` + a setup function in the module body |

## When to Use `.svelte.ts` vs `setContext/getContext`

| Scenario                                            | Pattern                                                              |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| State needed across unrelated component trees       | `.svelte.ts` module singleton                                        |
| State scoped to one subtree (e.g. a form, a widget) | `setContext` in parent, `getContext` in children                     |
| State that needs SSR / per-request isolation        | `setContext` in `+layout.svelte` (never module singletons on server) |

> **Warning**: Module singletons are shared across all users in SSR. Only use `.svelte.ts` singletons for state that is client-side only (e.g. UI state, client-cached data). For per-user server state, always use context.
