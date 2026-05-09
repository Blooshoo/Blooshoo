---
description: 'Use when writing or editing SvelteKit server modules: load functions, form actions, API routes, hooks, or any server-side logic. Enforces environment variable safety, auth guards, Drizzle query patterns, and form action conventions.'
applyTo: 'src/**/*.server.ts'
---

# Server Module Rules

## Environment Variables

Always use SvelteKit's env modules — never `process.env` directly.

| Secret / server-only | `$env/static/private` (build-time) or `$env/dynamic/private` (runtime) |
| -------------------- | ---------------------------------------------------------------------- |
| Public / client-safe | `$env/static/public` or `$env/dynamic/public`                          |

```ts
// ✅
import { DATABASE_URL } from '$env/static/private';

// ❌
const url = process.env.DATABASE_URL;
```

**Never** import `$env/static/private` or `$env/dynamic/private` from:

- `.svelte` component files
- `+page.ts` or `+layout.ts` (run on both server and client)
- Any module that may be imported client-side

## Auth Guard (better-auth)

`locals.user` is set by the better-auth hook in `hooks.server.ts`. Check it at the top of every `load()` and action that requires authentication.

```ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');
	// ...
};
```

For admin-only routes, also check `locals.user.role`:

```ts
if (!locals.user || locals.user.role !== 'admin') redirect(302, '/');
```

## Drizzle Queries

Import `db` from `$lib/server/db` and schema tables from `$lib/server/db/schema`.

```ts
import { db } from '$lib/server/db';
import { movies } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const movie = await db.query.movies.findFirst({ where: eq(movies.id, params.id) });
```

- Prefer `db.query.*` (relational API) over raw `db.select()` for readability
- Always type-check query results — Drizzle infers types from schema

## Form Actions

```ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/login');

		const data = await request.formData();
		const title = data.get('title');

		if (!title || typeof title !== 'string') {
			return fail(422, { title, error: 'Title is required' });
		}

		// mutate...
		redirect(303, '/movies');
	}
};
```

- Return `fail(status, data)` for validation/business errors (client sees `form` prop)
- Use `redirect(303, path)` after successful mutations
- Use `error(status, message)` from `@sveltejs/kit` for unexpected/fatal errors

## Types

Always annotate `load` and `actions` with generated types from `./$types`:

```ts
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => { ... };
export const actions: Actions = { ... };
```
