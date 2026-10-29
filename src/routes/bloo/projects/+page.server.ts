import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { parseProjectLinks } from '$lib/server/project-utils';
import { asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allProjects = await db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.createdAt));
	return {
		projects: allProjects.map((p) => ({
			...p,
			links: parseProjectLinks(p.links)
		}))
	};
};
