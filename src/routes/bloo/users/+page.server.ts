import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { account, discordAllowlist, session, users } from '$lib/server/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import {
	ensureDiscordAllowlistSeeded,
	isOwnerUser,
	isValidDiscordId,
	normalizeDiscordId,
	OWNER_DISCORD_ID
} from '$lib/server/discord-access';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	await ensureDiscordAllowlistSeeded();
	const canManageDiscordIds = Boolean(locals.user && (await isOwnerUser(locals.user.id)));
	if (canManageDiscordIds && locals.user) {
		await db.update(users).set({ role: 'admin' }).where(eq(users.id, locals.user.id));
	}

	const allUsers = await db
		.select({
			id: users.id,
			username: users.username,
			displayName: users.displayName,
			email: users.email,
			role: users.role,
			createdAt: users.createdAt,
			discordId: account.accountId
		})
		.from(users)
		.leftJoin(
			account,
			and(eq(account.userId, users.id), eq(account.providerId, 'discord'))
		);

	const allowedDiscordIds = await db
		.select({
			discordId: discordAllowlist.discordId,
			addedAt: discordAllowlist.addedAt,
			addedBy: discordAllowlist.addedBy,
			linkedDisplayName: users.displayName,
			linkedUsername: users.username
		})
		.from(discordAllowlist)
		.leftJoin(
			account,
			and(eq(account.accountId, discordAllowlist.discordId), eq(account.providerId, 'discord'))
		)
		.leftJoin(users, eq(users.id, account.userId))
		.orderBy(asc(discordAllowlist.addedAt));

	return {
		users: allUsers,
		allowedDiscordIds,
		canManageDiscordIds,
		ownerDiscordId: OWNER_DISCORD_ID
	};
};

async function requireOwner(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'admin' || !(await isOwnerUser(locals.user.id))) {
		redirect(302, '/bloo');
	}
}

export const actions: Actions = {
	// Discord-only auth: users are created automatically on first Discord
	// sign-in (the first user becomes admin). No manual create action.
	updateRole: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') redirect(302, '/bloo');

		const data = await request.formData();
		const id = data.get('id') as string;
		const roleRaw = data.get('role') as string;

		if (!id || !['admin', 'contributor'].includes(roleRaw)) {
			return fail(400, { error: 'Invalid user or role' });
		}

		// Prevent locking yourself out of the only admin account
		if (id === locals.user.id && roleRaw !== 'admin') {
			return fail(400, { error: 'You cannot demote your own account' });
		}

		await db
			.update(users)
			.set({ role: roleRaw as 'admin' | 'contributor' })
			.where(eq(users.id, id));

		return { success: true };
	},
	deleteUser: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') redirect(302, '/bloo');

		const data = await request.formData();
		const id = data.get('id') as string;

		if (id === locals.user.id) return fail(400, { error: 'Cannot delete your own account' });

		await db.delete(users).where(eq(users.id, id));
		return { success: true, message: 'User deleted.' };
	},
	addDiscordId: async ({ request, locals }) => {
		await requireOwner(locals);

		const data = await request.formData();
		const rawDiscordId = data.get('discordId');
		if (typeof rawDiscordId !== 'string') {
			return fail(400, { error: 'Enter a Discord user ID.' });
		}

		const discordId = normalizeDiscordId(rawDiscordId);
		if (!isValidDiscordId(discordId)) {
			return fail(400, { error: 'Discord IDs must be 17–20 digits.' });
		}
		if (discordId === OWNER_DISCORD_ID) {
			return fail(400, { error: 'Your owner ID is always enabled.' });
		}

		const inserted = await db
			.insert(discordAllowlist)
			.values({ discordId, addedBy: locals.user!.id })
			.onConflictDoNothing()
			.returning({ discordId: discordAllowlist.discordId });

		if (!inserted.length) {
			return fail(409, { error: 'That Discord ID is already authorised.' });
		}

		return { success: true, message: 'Discord ID authorised.' };
	},
	removeDiscordId: async ({ request, locals }) => {
		await requireOwner(locals);

		const data = await request.formData();
		const rawDiscordId = data.get('discordId');
		if (typeof rawDiscordId !== 'string') {
			return fail(400, { error: 'Missing Discord user ID.' });
		}

		const discordId = normalizeDiscordId(rawDiscordId);
		if (!isValidDiscordId(discordId)) {
			return fail(400, { error: 'Invalid Discord user ID.' });
		}
		if (discordId === OWNER_DISCORD_ID) {
			return fail(400, { error: 'The owner ID cannot be removed.' });
		}

		const [linkedAccount] = await db
			.select({ userId: account.userId })
			.from(account)
			.where(and(eq(account.accountId, discordId), eq(account.providerId, 'discord')))
			.limit(1);

		await db.delete(discordAllowlist).where(eq(discordAllowlist.discordId, discordId));
		if (linkedAccount) {
			await db.delete(session).where(eq(session.userId, linkedAccount.userId));
		}

		return { success: true, message: 'Discord ID removed and active sessions revoked.' };
	}
};
