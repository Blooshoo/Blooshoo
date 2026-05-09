import { json, error } from '@sveltejs/kit';
import { generateExcerpt } from '$lib/server/deepseek';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const { title, content } = await request.json();
	if (!title || !content) error(400, 'title and content are required');

	const excerpt = await generateExcerpt(title, content);
	return json({ excerpt });
};
