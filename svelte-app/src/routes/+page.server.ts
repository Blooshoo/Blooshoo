import { db } from '$lib/server/db';
import { posts, projects } from '$lib/server/db/schema';
import { eq, desc, and, asc } from 'drizzle-orm';
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
			.where(and(eq(projects.featured, true), eq(projects.ownerType, 'mine')))
			.orderBy(asc(projects.sortOrder))
	]);

	return {
		latestPosts: latestPosts.map((p) => ({ ...p, tags: JSON.parse(p.tags) as string[] })),
		featuredProjects: featuredProjects.map((p) => ({
			...p,
			links: JSON.parse(p.links) as { label: string; url: string }[]
		}))
	};
};
