import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') redirect(302, '/bloo');

	const allUsers = await db
		.select({
			id: users.id,
			username: users.username,
			displayName: users.displayName,
			email: users.email,
			role: users.role,
			createdAt: users.createdAt
		})
		.from(users);

	return { users: allUsers };
};

export const actions: Actions = {
	createUser: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') redirect(302, '/bloo');

		const data = await request.formData();
		const email = (data.get('email') as string)?.trim();
		const username = (data.get('username') as string)?.trim();
		const displayName = (data.get('displayName') as string)?.trim();
		const password = data.get('password') as string;
		const role = (data.get('role') as string) === 'admin' ? 'admin' : 'contributor';

		if (!email || !username || !password) {
			return fail(400, { error: 'Email, username, and password are required' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		const passwordHash = await bcrypt.hash(password, 12);

		try {
			await db.insert(users).values({
				id: crypto.randomUUID(),
				email,
				username,
				displayName: displayName || username,
				passwordHash,
				role
			});
		} catch {
			return fail(400, { error: 'Email or username already exists' });
		}

		return { success: true };
	},
	deleteUser: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') redirect(302, '/bloo');

		const data = await request.formData();
		const id = data.get('id') as string;

		if (id === locals.user.id) return fail(400, { error: 'Cannot delete your own account' });

		await db.delete(users).where(eq(users.id, id));
	}
};
