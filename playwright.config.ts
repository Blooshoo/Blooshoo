import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './src',
	testMatch: '**/*.e2e.ts',
	use: {
		baseURL: process.env.TEST_URL ?? 'http://localhost:7777',
		extraHTTPHeaders: {
			// Avoid hitting rate limits during tests by sending X-Forwarded-For
			// with a unique IP per test worker
		}
	},
	projects: [
		{
			name: 'chromium',
			use: { browserName: 'chromium' }
		}
	],
	// Run against local Docker deployment
	webServer: undefined // we rely on Docker being up already
});
