import { env } from '$env/dynamic/private';

/**
 * Read a required environment variable, failing loudly at boot with a
 * useful message instead of crashing confusingly mid-request.
 *
 * Security note: any value listed in `forbidden` is treated as a known
 * insecure default (e.g. the old docker-compose fallback secret) and
 * rejected. Generate a fresh value — see .env.example.
 */
export function requireEnv(
	name: string,
	opts?: { minLength?: number; forbidden?: string[] }
): string {
	const value = env[name];

	if (value === undefined || value === '') {
		throw new Error(
			`Missing required environment variable: ${name}. Copy .env.example to .env.local and fill it in.`
		);
	}
	if (opts?.minLength && value.length < opts.minLength) {
		throw new Error(
			`Environment variable ${name} must be at least ${opts.minLength} characters.`
		);
	}
	if (opts?.forbidden?.includes(value)) {
		throw new Error(
			`Environment variable ${name} is set to a known-insecure default value. Generate a fresh one (e.g. \`openssl rand -base64 32\` for AUTH_SECRET) and put it in .env.local.`
		);
	}

	return value;
}
