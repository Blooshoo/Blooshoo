import { db } from '$lib/server/db';
import { projects, users } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [allUsers, allProjects] = await Promise.all([
		db
			.select({
				id: users.id,
				username: users.username,
				displayName: users.displayName,
				role: users.role
			})
			.from(users)
			.orderBy(users.createdAt),
		db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.createdAt))
	]);

	return {
		friends: allUsers,
		projects: allProjects.map((p) => ({
			...p,
			links: JSON.parse(p.links) as { label: string; url: string }[]
		}))
	};
};
