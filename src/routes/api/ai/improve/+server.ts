import { json, error } from '@sveltejs/kit';
import { improveWriting } from '$lib/server/deepseek';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const { text } = await request.json();
	if (!text) error(400, 'text is required');

	const improved = await improveWriting(text);
	return json({ improved });
};
