import { db } from '$lib/server/db';
import { posts, projects, media, messages } from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [[postCount], [draftCount], [projectCount], [mediaCount], [messageCount]] =
		await Promise.all([
			db.select({ count: count() }).from(posts).where(eq(posts.status, 'published')),
			db.select({ count: count() }).from(posts).where(eq(posts.status, 'draft')),
			db.select({ count: count() }).from(projects),
			db.select({ count: count() }).from(media),
			db.select({ count: count() }).from(messages).where(eq(messages.status, 'unread'))
		]);

	return {
		stats: {
			publishedPosts: postCount?.count ?? 0,
			draftPosts: draftCount?.count ?? 0,
			projects: projectCount?.count ?? 0,
			media: mediaCount?.count ?? 0,
			unreadMessages: messageCount?.count ?? 0
		}
	};
};
