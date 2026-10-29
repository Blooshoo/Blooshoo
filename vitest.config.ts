import { defineConfig } from 'vitest/config';

// Unit tests for pure server helpers. They avoid SvelteKit's $env/$app
// modules, so they don't need the SvelteKit Vite plugin. E2E tests live in
// *.e2e.ts and run through Playwright instead.
export default defineConfig({
	resolve: {
		alias: { $lib: new URL('./src/lib', import.meta.url).pathname }
	},
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
		expect: { requireAssertions: true },
		restoreMocks: true
	}
});
