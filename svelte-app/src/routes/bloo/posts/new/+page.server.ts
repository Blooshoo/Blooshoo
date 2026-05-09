import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { posts } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/bloo/login');

		const data = await request.formData();
		const title = (data.get('title') as string)?.trim();
		const slug = (data.get('slug') as string)?.trim();
		const content = (data.get('content') as string) ?? '';
		const excerpt = (data.get('excerpt') as string)?.trim() ?? '';
		const coverImage = (data.get('coverImage') as string)?.trim() ?? '';
		const tagsRaw = (data.get('tags') as string) ?? '';
		const status = (data.get('status') as string) === 'published' ? 'published' : 'draft';

		if (!title || !slug) {
			return fail(400, { error: 'Title and slug are required' });
		}

		const tags = JSON.stringify(
			tagsRaw
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean)
		);

		await db.insert(posts).values({
			title,
			slug,
			content,
			excerpt,
			coverImage,
			tags,
			status,
			authorId: locals.user.id
		});

		redirect(302, '/bloo/posts');
	}
};
