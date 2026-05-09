import { redirect, fail, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { posts } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [post] = await db.select().from(posts).where(eq(posts.id, Number(params.id))).limit(1);
	if (!post) error(404, 'Post not found');
	return { post: { ...post, tags: JSON.parse(post.tags) as string[] } };
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
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

		await db
			.update(posts)
			.set({ title, slug, content, excerpt, coverImage, tags, status, updatedAt: new Date() })
			.where(eq(posts.id, Number(params.id)));

		return { success: true };
	},
	delete: async ({ locals, params }) => {
		if (!locals.user) redirect(302, '/bloo/login');
		await db.delete(posts).where(eq(posts.id, Number(params.id)));
		redirect(302, '/bloo/posts');
	}
};
