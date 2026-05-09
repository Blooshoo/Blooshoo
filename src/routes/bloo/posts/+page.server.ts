import { db } from '$lib/server/db';
import { posts } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));
	return {
		posts: allPosts.map((p) => ({ ...p, tags: JSON.parse(p.tags) as string[] }))
	};
};
