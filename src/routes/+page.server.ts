import { db } from '$lib/server/db';
import { posts, projects } from '$lib/server/db/schema';
import { parsePostTags } from '$lib/server/post-utils';
import { parseProjectLinks } from '$lib/server/project-utils';
import { eq, desc, and, asc, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [latestPosts, featuredProjects] = await Promise.all([
		db
			.select()
			.from(posts)
			.where(eq(posts.status, 'published'))
			.orderBy(desc(posts.createdAt))
			.limit(3),
		db
			.select()
			.from(projects)
			.where(and(eq(projects.featured, true), inArray(projects.ownerType, ['mine', 'collab'])))
			.orderBy(asc(projects.sortOrder))
	]);

	return {
		latestPosts: latestPosts.map((p) => ({ ...p, tags: parsePostTags(p.tags) })),
		featuredProjects: featuredProjects.map((p) => ({
			...p,
			links: parseProjectLinks(p.links)
		}))
	};
};
