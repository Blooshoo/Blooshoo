import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { media } from '$lib/server/db/schema';
import { uploadToBunnyCDN, getBunnyCDNUrl } from '$lib/server/bunnycdn';
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

	const buffer = await file.arrayBuffer();
	await uploadToBunnyCDN(buffer, filename, file.type);

	const url = getBunnyCDNUrl(filename);

	const [inserted] = await db
		.insert(media)
		.values({
			filename,
			originalName: file.name,
			url,
			mimeType: file.type,
			size: file.size
		})
		.returning();

	return json({ url, id: inserted.id });
};
