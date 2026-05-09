import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ALLOWED_MIME_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/svg+xml',
	'video/mp4',
	'video/webm',
	'application/pdf'
]);

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Unauthorized');

	const formData = await request.formData();
	const file = formData.get('file');

	if (!file || !(file instanceof File)) error(400, 'No file provided');
	if (!ALLOWED_MIME_TYPES.has(file.type)) error(400, 'File type not allowed');
	if (file.size > MAX_SIZE) error(400, 'File too large (max 50 MB)');

	const safeName = file.name.replaceAll(/[^a-zA-Z0-9._-]/g, '_');
	const filename = `${Date.now()}-${safeName}`;

	error(503, 'Media uploads are not available yet.');
};
