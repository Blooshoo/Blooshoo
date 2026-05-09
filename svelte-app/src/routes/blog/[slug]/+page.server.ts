import { db } from '$lib/server/db';
import { posts, users } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import sanitizeHtml from 'sanitize-html';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const [row] = await db
		.select({
			id: posts.id,
			title: posts.title,
			slug: posts.slug,
			content: posts.content,
			excerpt: posts.excerpt,
			coverImage: posts.coverImage,
			tags: posts.tags,
			createdAt: posts.createdAt,
			updatedAt: posts.updatedAt,
			authorDisplayName: users.displayName
		})
		.from(posts)
		.leftJoin(users, eq(posts.authorId, users.id))
		.where(and(eq(posts.slug, params.slug), eq(posts.status, 'published')))
		.limit(1);

	if (!row) error(404, 'Post not found');

	const cleanContent = sanitizeHtml(row.content, {
		allowedTags: [
			'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'p', 'br', 'hr',
			'strong', 'b', 'em', 'i', 's', 'u',
			'ul', 'ol', 'li',
			'blockquote', 'pre', 'code',
			'a', 'img',
			'span', 'div'
		],
		allowedAttributes: {
			a: ['href', 'class', 'target', 'rel'],
			img: ['src', 'alt', 'class'],
			span: ['style', 'class'],
			'*': ['class']
		},
		allowedStyles: {
			span: {
				color: [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^rgba\(/]
			}
		},
		transformTags: {
			a: (tagName, attribs) => ({
				tagName,
				attribs: {
					...attribs,
					rel: 'noopener noreferrer',
					target: attribs.href?.startsWith('http') ? '_blank' : attribs.target ?? ''
				}
			})
		}
	});

	return {
		post: {
			...row,
			tags: JSON.parse(row.tags) as string[],
			cleanContent
		}
	};
};
