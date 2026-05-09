import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from './db';
import * as schema from './db/schema';
import bcrypt from 'bcryptjs';
import {
	AUTH_SECRET,
	BETTER_AUTH_URL,
	BETTER_AUTH_TRUSTED_ORIGINS,
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
	ALLOWED_DISCORD_IDS
} from '$env/static/private';

const allowedDiscordIds = new Set(
	ALLOWED_DISCORD_IDS.split(',')
			.map((id: string) => id.trim())
		.filter(Boolean)
);

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

	socialProviders: {
		discord: {
			clientId: DISCORD_CLIENT_ID,
			clientSecret: DISCORD_CLIENT_SECRET
		}
	},

	emailAndPassword: {
		enabled: true,
		password: {
			hash: async (password: string) => bcrypt.hash(password, 12),
			verify: async ({ hash, password }: { hash: string; password: string }) =>
				bcrypt.compare(password, hash)
		},
		disableSignUp: true
	},

	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					if (!user.username) {
						const derived = (user.email?.split('@')[0] ?? user.id)
							.toLowerCase()
							.replace(/[^a-z0-9_]/g, '_');
						return { data: { ...user, username: derived } };
					}
					return { data: user };
				}
			}
		},
		account: {
			create: {
				before: async (accountData) => {
					if (
						accountData.providerId === 'discord' &&
						!allowedDiscordIds.has(accountData.accountId)
					) {
						throw new Error('Your Discord account is not authorised to access this panel.');
					}
					return { data: accountData };
				}
			}
		}
	}
});
