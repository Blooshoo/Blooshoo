import { and, eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from './db';
import { account, discordAllowlist } from './db/schema';

// This is the one owner identity. It is intentionally code-level protection
// so an allowlist mistake cannot remove the owner's ability to recover access.
export const OWNER_DISCORD_ID = '274013941821341696';

const DISCORD_ID_PATTERN = /^\d{17,20}$/;
let seedPromise: Promise<void> | undefined;

export function normalizeDiscordId(value: string): string {
	return value.trim();
}

export function isValidDiscordId(value: string): boolean {
	return DISCORD_ID_PATTERN.test(normalizeDiscordId(value));
}

/**
 * The environment list remains a one-time bootstrap source for existing
 * deployments. Once the owner row exists, the database is authoritative, so
 * removing an ID in the panel stays removed even if an old env value remains.
 */
export async function ensureDiscordAllowlistSeeded(): Promise<void> {
	if (!seedPromise) {
		seedPromise = (async () => {
			const [ownerEntry] = await db
				.select({ discordId: discordAllowlist.discordId })
				.from(discordAllowlist)
				.where(eq(discordAllowlist.discordId, OWNER_DISCORD_ID))
				.limit(1);

			if (ownerEntry) return;

			const configuredIds = (env.ALLOWED_DISCORD_IDS ?? '')
				.split(',')
				.map(normalizeDiscordId)
				.filter(isValidDiscordId);
			const ids = [...new Set([OWNER_DISCORD_ID, ...configuredIds])];

			await db
				.insert(discordAllowlist)
				.values(ids.map((discordId) => ({ discordId })))
				.onConflictDoNothing();
		})().catch((error) => {
				seedPromise = undefined;
				throw error;
			});
	}

	await seedPromise;
}

export async function isDiscordIdAllowed(discordId: string): Promise<boolean> {
	const normalizedId = normalizeDiscordId(discordId);
	if (!isValidDiscordId(normalizedId)) return false;

	await ensureDiscordAllowlistSeeded();
	if (normalizedId === OWNER_DISCORD_ID) return true;

	const [entry] = await db
		.select({ discordId: discordAllowlist.discordId })
		.from(discordAllowlist)
		.where(eq(discordAllowlist.discordId, normalizedId))
		.limit(1);

	return Boolean(entry);
}

export async function getDiscordAccountId(userId: string): Promise<string | null> {
	const [linkedAccount] = await db
		.select({ accountId: account.accountId })
		.from(account)
		.where(and(eq(account.userId, userId), eq(account.providerId, 'discord')))
		.limit(1);

	return linkedAccount?.accountId ?? null;
}

export async function isOwnerUser(userId: string): Promise<boolean> {
	return (await getDiscordAccountId(userId)) === OWNER_DISCORD_ID;
}
