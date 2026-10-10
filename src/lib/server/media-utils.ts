import { desc, like } from 'drizzle-orm';
import { db } from './db';
import { media } from './db/schema';

export async function getImageMedia() {
	return db
		.select({
			id: media.id,
			filename: media.filename,
			originalName: media.originalName,
			url: media.url,
			mimeType: media.mimeType
		})
		.from(media)
		.where(like(media.mimeType, 'image/%'))
		.orderBy(desc(media.createdAt));
}
