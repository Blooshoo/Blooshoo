import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allUsers = await db.select({ id: users.id, displayName: users.displayName }).from(users);
	return { users: allUsers };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
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

		let links: string;
		try {
			links = JSON.stringify(JSON.parse(linksRaw));
		} catch {
			return fail(400, { error: 'Links must be valid JSON' });
		}

		await db.insert(projects).values({
			title,
			description,
			category,
			ownerType,
			ownerId,
			image,
			links,
			featured,
			sortOrder
		});

		redirect(302, '/bloo/projects');
	}
};
