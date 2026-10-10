import { redirect, fail, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { posts } from '$lib/server/db/schema';
import { and, eq, ne } from 'drizzle-orm';
import {
	databaseErrorCode,
	formString,
	isUniqueConstraintError,
	normalizePostSlug,
	parsePostTags,
	derivePostExcerpt
} from '$lib/server/post-utils';
import { getImageMedia } from '$lib/server/media-utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id < 1) error(404, 'Post not found');

	const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
	if (!post) error(404, 'Post not found');
	return { post: { ...post, tags: parsePostTags(post.tags) }, media: await getImageMedia() };
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		if (!locals.user) redirect(302, '/bloo/login');

		const data = await request.formData();
		const title = formString(data, 'title').trim();
		const content = formString(data, 'content');
		const slug = normalizePostSlug(formString(data, 'slug')) || normalizePostSlug(title);
		const excerpt = formString(data, 'excerpt').trim() || derivePostExcerpt(content);
		const coverImage = formString(data, 'coverImage').trim();
		const tagsRaw = formString(data, 'tags');
		const status = formString(data, 'status') === 'published' ? 'published' : 'draft';

		if (!title || !slug) {
			return fail(400, { error: 'Add a title that can be used to create the post URL.' });
		}

		const tags = JSON.stringify(
			tagsRaw
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean)
		);

		const id = Number(params.id);
		if (!Number.isInteger(id) || id < 1) return fail(404, { error: 'Post not found' });

		try {
			const [existing] = await db
				.select({ id: posts.id })
				.from(posts)
				.where(and(eq(posts.slug, slug), ne(posts.id, id)))
				.limit(1);
			if (existing) {
				return fail(400, { error: 'That slug is already in use. Choose a different one.' });
			}

			await db
				.update(posts)
				.set({ title, slug, content, excerpt, coverImage, tags, status, updatedAt: new Date() })
				.where(eq(posts.id, id));
		} catch (error) {
			if (isUniqueConstraintError(error)) {
				return fail(400, { error: 'That slug is already in use. Choose a different one.' });
			}

			console.error('Post update failed', { code: databaseErrorCode(error) });
			return fail(503, {
				error: 'The post service is temporarily unavailable. Your changes were not saved; please try again.'
			});
		}

		return { success: true };
	},
	delete: async ({ locals, params }) => {
		if (!locals.user) redirect(302, '/bloo/login');
		const id = Number(params.id);
		if (!Number.isInteger(id) || id < 1) return fail(404, { error: 'Post not found' });
		await db.delete(posts).where(eq(posts.id, id));
		redirect(302, '/bloo/posts');
	}
};
