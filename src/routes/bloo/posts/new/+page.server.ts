import { redirect, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { posts } from '$lib/server/db/schema';
import {
	databaseErrorCode,
	formString,
	isUniqueConstraintError,
	normalizePostSlug,
	derivePostExcerpt
} from '$lib/server/post-utils';
import { getImageMedia } from '$lib/server/media-utils';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { media: await getImageMedia() };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
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

		try {
			const [existing] = await db
				.select({ id: posts.id })
				.from(posts)
				.where(eq(posts.slug, slug))
				.limit(1);
			if (existing) {
				return fail(400, { error: 'That slug is already in use. Choose a different one.' });
			}

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
		} catch (error) {
			if (isUniqueConstraintError(error)) {
				return fail(400, { error: 'That slug is already in use. Choose a different one.' });
			}

			console.error('Post creation failed', { code: databaseErrorCode(error) });
			return fail(503, {
				error: 'The post service is temporarily unavailable. Nothing was published; please try again.'
			});
		}

		redirect(302, '/bloo/posts');
	}
};
