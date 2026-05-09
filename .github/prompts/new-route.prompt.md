---
description: 'Scaffold a new SvelteKit route with a server load function and Svelte 5 page component. Generates +page.server.ts (auth guard, Drizzle stub, typed return) and +page.svelte (runes, Tailwind layout).'
name: 'New Route'
argument-hint: "Route path and purpose (e.g. 'movies/[id] detail page' or 'movies list with search')"
agent: 'agent'
---

Scaffold a new SvelteKit route for: ${input}

Follow all conventions in:

- [svelte5.instructions.md](.github/instructions/svelte5.instructions.md)
- [server-ts.instructions.md](.github/instructions/server-ts.instructions.md)

## What to create

Determine the route path from the input (e.g. `movies/[id]` → `src/routes/movies/[id]/`).

### 1. `+page.server.ts`

```ts
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) redirect(302, '/login');

	// TODO: replace with real query
	// const item = await db.query.<table>.findFirst({ where: eq(<table>.id, params.id) });

	return {
		// item
	};
};
```

- Add `actions: Actions` only if the route has a form — skip it for read-only pages
- Use `fail` / `redirect` from `@sveltejs/kit` in actions per [server-ts.instructions.md](.github/instructions/server-ts.instructions.md)

### 2. `+page.svelte`

```svelte
<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<div class="p-6">
	<h1 class="text-2xl font-bold"><!-- Page title --></h1>
	<!-- TODO: render data -->
</div>
```

- Use Svelte 5 runes throughout (`$props`, `$state`, `$derived`)
- Tailwind utility classes for layout (`p-6`, `flex`, `gap-4`, etc.)
- No `export let`, no `on:` directives, no `<slot>`

## After generating

List the files created and their paths. Ask if a form action should be added.
