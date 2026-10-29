import { redirect, fail, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';
import { parseProjectForm, parseProjectLinks } from '$lib/server/project-utils';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [project] = await db.select().from(projects).where(eq(projects.id, Number(params.id))).limit(1);
	if (!project) error(404, 'Project not found');

	const allUsers = await db.select({ id: users.id, displayName: users.displayName }).from(users);

	return {
		project: {
			...project,
			links: parseProjectLinks(project.links)
		},
		users: allUsers
	};
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		if (!locals.user) redirect(302, '/bloo/login');

		const parsed = parseProjectForm(await request.formData(), locals.user.id);
		if (!parsed.ok) return fail(400, { error: parsed.error });

		await db
			.update(projects)
			.set({ ...parsed.values, updatedAt: new Date() })
			.where(eq(projects.id, Number(params.id)));

		return { success: true };
	},
	delete: async ({ locals, params }) => {
		if (!locals.user) redirect(302, '/bloo/login');
		await db.delete(projects).where(eq(projects.id, Number(params.id)));
		redirect(302, '/bloo/projects');
	}
};
