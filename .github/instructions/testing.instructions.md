---
description: "Use when writing or editing tests. Covers the two Vitest project environments (client browser tests and server node tests), e2e Playwright tests, file naming conventions, and the requireAssertions rule."
applyTo: "src/**/*.test.ts", "src/**/*.spec.ts", "src/**/*.e2e.ts", "src/**/*.svelte.test.ts", "src/**/*.svelte.spec.ts"
---

# Testing Rules

## Two Test Environments

This project uses a split Vitest config with two projects. Use the correct file extension to target the right runner:

| Environment          | File pattern                            | Runner                          | Use for                                                  |
| -------------------- | --------------------------------------- | ------------------------------- | -------------------------------------------------------- |
| **Client** (browser) | `*.svelte.test.ts` / `*.svelte.spec.ts` | Playwright (Chromium, headless) | Svelte component tests, DOM interaction                  |
| **Server** (Node)    | `*.test.ts` / `*.spec.ts`               | Node                            | Server logic, load functions, utilities, Drizzle queries |

> The client project **excludes** `src/lib/server/**` — never write browser tests for server modules.

## File Placement

Co-locate test files with the code they test:

```
src/lib/components/ui/StatCard.svelte
src/lib/components/ui/StatCard.svelte.test.ts   ← client test

src/lib/server/db/queries.ts
src/lib/server/db/queries.test.ts               ← server test
```

## requireAssertions

`expect.requireAssertions: true` is set globally. **Every test must contain at least one assertion** — tests with no `expect(...)` call will fail:

```ts
// ✅
it('returns the movie title', () => {
	expect(getTitle({ title: 'Manos' })).toBe('Manos');
});

// ❌ — will fail at runtime even if no error thrown
it('does something', () => {
	getTitle({ title: 'Manos' });
});
```

## Client Component Tests (`.svelte.test.ts`)

Use `@testing-library/svelte` for rendering and interaction. Import `render` and query helpers:

```ts
import { render, screen } from '@testing-library/svelte';
import StatCard from './StatCard.svelte';

it('renders the value', () => {
	render(StatCard, { props: { title: 'Guilds', value: 42 } });
	expect(screen.getByText('42')).toBeInTheDocument();
});
```

- Do not use `document.querySelector` — prefer Testing Library queries (`getByText`, `getByRole`, etc.)
- Do not import from `$lib/server/**` in client tests (the client project excludes these)

## Server Tests (`.test.ts`)

Plain Vitest tests running in Node. Use for pure functions, server utilities, and Drizzle query logic:

```ts
import { describe, it, expect } from 'vitest';
import { formatMovieTitle } from './format';

describe('formatMovieTitle', () => {
	it('uppercases the title', () => {
		expect(formatMovieTitle('manos')).toBe('MANOS');
	});
});
```

Mock the `db` client when testing server logic to avoid real database calls:

```ts
import { vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
	db: { query: { movie: { findMany: vi.fn().mockResolvedValue([]) } } }
}));
```

## E2E Tests (`.e2e.ts`)

End-to-end tests use Playwright directly (not Vitest). They run against the built preview server on port `4173`:

```ts
// src/routes/login/login.e2e.ts
import { test, expect } from '@playwright/test';

test('redirects unauthenticated users to /login', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveURL('/login');
});
```

- File pattern: `**/*.e2e.{ts,js}` — picked up by `playwright.config.ts`
- Run with: `npx playwright test`
- Do not use `vitest` imports in `.e2e.ts` files — use `@playwright/test` only

## Running Tests

```bash
# All Vitest tests (both client and server)
npm run test

# Watch mode
npx vitest

# E2E only (requires build first)
npx playwright test
```
