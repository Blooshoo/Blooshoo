import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import { db } from './db';
import * as schema from './db/schema';
import { requireEnv } from './env';
import {
	ensureDiscordAllowlistSeeded,
	isDiscordIdAllowed,
	OWNER_DISCORD_ID
} from './discord-access';
import { env } from '$env/dynamic/private';

// ── Environment ────────────────────────────────────────────────────────
// Fail loudly at boot: no silent default secrets, no confusing .split()
// crashes when a variable is unset.
const AUTH_SECRET = requireEnv('AUTH_SECRET', {
	minLength: 32,
	forbidden: ['local-dev-secret-change-in-prod-123!', 'build-placeholder-secret-32-chars!!']
});
const BETTER_AUTH_URL = env.BETTER_AUTH_URL ?? 'http://localhost:7777';
const BETTER_AUTH_TRUSTED_ORIGINS = env.BETTER_AUTH_TRUSTED_ORIGINS;
const DISCORD_CLIENT_ID = env.DISCORD_CLIENT_ID ?? '';
const DISCORD_CLIENT_SECRET = env.DISCORD_CLIENT_SECRET ?? '';
export const auth = betterAuth({
	secret: AUTH_SECRET,
	baseURL: BETTER_AUTH_URL,
	trustedOrigins: BETTER_AUTH_TRUSTED_ORIGINS ? BETTER_AUTH_TRUSTED_ORIGINS.split(',') : [],

	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			...schema,
			user: schema.users
		}
	}),

	user: {
		modelName: 'users',
		fields: {
			name: 'displayName',
			emailVerified: 'emailVerified',
			createdAt: 'createdAt',
			updatedAt: 'updatedAt'
		},
		additionalFields: {
			role: {
				type: 'string',
				required: false,
				defaultValue: 'contributor',
				input: false
			},
			username: {
				type: 'string',
				required: false,
				input: false
			}
		}
	},

	session: {
		expiresIn: 60 * 60 * 24 * 30,
		updateAge: 60 * 60 * 24,
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60
		}
	},

	rateLimit: {
		enabled: true,
		window: 60,
		max: 10
	},

	// Discord is the single sign-in provider. The email/password path was
	// removed: it was dead code (session cookie never forwarded) with two
	// competing password stores (users.password_hash vs account.password).
	socialProviders: {
		discord: {
			clientId: DISCORD_CLIENT_ID,
			clientSecret: DISCORD_CLIENT_SECRET
		}
	},

	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					// Bootstrap: the first user to sign in (empty users table)
					// becomes admin, so a fresh Discord-only deploy is usable.
					const isFirstUser = (await db.$count(schema.users)) === 0;
					const derived = (user.email?.split('@')[0] ?? user.id)
						.toLowerCase()
						.replace(/[^a-z0-9_]/g, '_');
					return {
						data: {
							...user,
							username: user.username ?? derived,
							...(isFirstUser ? { role: 'admin' } : {})
						}
					};
				}
			}
		},
		account: {
			create: {
				before: async (accountData) => {
					if (accountData.providerId === 'discord') {
						await ensureDiscordAllowlistSeeded();
						if (accountData.accountId === OWNER_DISCORD_ID) {
							await db
								.update(schema.users)
								.set({ role: 'admin' })
								.where(eq(schema.users.id, accountData.userId));
						}
					}

					if (
						accountData.providerId === 'discord' &&
						!(await isDiscordIdAllowed(accountData.accountId))
					) {
						throw new Error('Your Discord account is not authorised to access this panel.');
					}
					return { data: accountData };
				}
			}
		}
	}
});
