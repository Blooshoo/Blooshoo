import { redirect, fail, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [project] = await db.select().from(projects).where(eq(projects.id, Number(params.id))).limit(1);
	if (!project) error(404, 'Project not found');

	const allUsers = await db.select({ id: users.id, displayName: users.displayName }).from(users);

	return {
		project: {
			...project,
			links: JSON.parse(project.links) as { label: string; url: string }[]
		},
		users: allUsers
	};
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		if (!locals.user) redirect(302, '/bloo/login');

		const data = await request.formData();
		const title = (data.get('title') as string)?.trim();
		const description = (data.get('description') as string)?.trim() ?? '';
		const categoryRaw = (data.get('category') as string)?.trim() ?? 'other';
		const ownerTypeRaw = (data.get('ownerType') as string) ?? 'mine';
		const category = categoryRaw as 'website' | 'game' | 'mod' | 'other';
		const ownerType = ownerTypeRaw as 'mine' | 'friend';
		const ownerId = (data.get('ownerId') as string)?.trim() || locals.user.id;
		const image = (data.get('image') as string)?.trim() ?? '';
		const linksRaw = (data.get('links') as string)?.trim() ?? '[]';
		const featured = data.get('featured') === 'true';
		const sortOrder = Number.parseInt(data.get('sortOrder') as string) || 0;

		if (!title) return fail(400, { error: 'Title is required' });

		let links = '[]';
		try {
			links = JSON.stringify(JSON.parse(linksRaw));
		} catch {
			return fail(400, { error: 'Links must be valid JSON' });
		}

		await db
			.update(projects)
			.set({ title, description, category, ownerType, ownerId, image, links, featured, sortOrder, updatedAt: new Date() })
			.where(eq(projects.id, Number(params.id)));

		return { success: true };
	},
	delete: async ({ locals, params }) => {
		if (!locals.user) redirect(302, '/bloo/login');
		await db.delete(projects).where(eq(projects.id, Number(params.id)));
		redirect(302, '/bloo/projects');
	}
};
