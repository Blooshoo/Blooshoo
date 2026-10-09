import { db } from '$lib/server/db';
import { messages } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allMessages = await db.select().from(messages).orderBy(desc(messages.createdAt));
	return { messages: allMessages };
};

export const actions: Actions = {
	updateStatus: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/bloo/login');

		const data = await request.formData();
		const id = Number(data.get('id'));
		const statusRaw = data.get('status') as string;

		if (!id || !['unread', 'read', 'replied'].includes(statusRaw)) return;
		const status = statusRaw as 'unread' | 'read' | 'replied';

		await db.update(messages).set({ status }).where(eq(messages.id, id));
	},
	delete: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/bloo/login');
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (id) await db.delete(messages).where(eq(messages.id, id));
	}
};
