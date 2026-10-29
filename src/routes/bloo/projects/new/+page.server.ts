import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';
import { parseProjectForm } from '$lib/server/project-utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allUsers = await db.select({ id: users.id, displayName: users.displayName }).from(users);
	return { users: allUsers };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/bloo/login');

		const parsed = parseProjectForm(await request.formData(), locals.user.id);
		if (!parsed.ok) return fail(400, { error: parsed.error });

		await db.insert(projects).values(parsed.values);

		redirect(302, '/bloo/projects');
	}
};
