import { db } from '$lib/server/db';
import { media } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';
// BunnyCDN disabled — import kept for future use
// import { deleteFromBunnyCDN, extractFilenameFromUrl } from '$lib/server/bunnycdn';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allMedia = await db.select().from(media).orderBy(desc(media.createdAt));
	return { media: allMedia };
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/bloo/login');

		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!id) return;

		const [item] = await db.select().from(media).where(eq(media.id, id)).limit(1);
		if (!item) return;

		// CDN delete skipped (BunnyCDN disabled)
		await db.delete(media).where(eq(media.id, id));
	}
};
