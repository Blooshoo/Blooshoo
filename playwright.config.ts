import { defineConfig } from '@playwright/test';

// Two ways to run the e2e suite:
//
//   npm run test:e2e
//     Builds and starts the Docker stack (app + Postgres) on :7777 and runs
//     once it answers. An already-running stack (`docker compose up -d`) is
//     reused and left running; one started here is stopped afterwards.
//     Needs .env.local with AUTH_SECRET and POSTGRES_PASSWORD (see .env.example).
//
//   TEST_URL=https://staging.example npm run test:e2e
//     Runs against an existing deployment; nothing is started.
const externalUrl = process.env.TEST_URL;
const baseURL = externalUrl ?? 'http://localhost:7777';

export default defineConfig({
	testDir: './src',
	testMatch: '**/*.e2e.ts',
	use: { baseURL },
	projects: [
		{
			name: 'chromium',
			use: { browserName: 'chromium' }
		}
	],
	webServer: externalUrl
		? undefined
		: {
				command: 'docker compose --env-file .env.local up --build',
				url: baseURL,
				reuseExistingServer: true,
				timeout: 10 * 60 * 1000,
				stdout: 'pipe'
			}
});
