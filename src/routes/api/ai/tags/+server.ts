import { json, error } from '@sveltejs/kit';
import { suggestTags } from '$lib/server/deepseek';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const { title, content } = await request.json();
	if (!title || !content) error(400, 'title and content are required');

	const tags = await suggestTags(title, content);
	return json({ tags });
};
