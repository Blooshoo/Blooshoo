import { z } from 'zod';
import { formString } from './post-utils';

export const PROJECT_CATEGORIES = ['website', 'game', 'mod', 'other'] as const;
export const PROJECT_OWNER_TYPES = ['mine', 'friend', 'collab'] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];
export type ProjectOwnerType = (typeof PROJECT_OWNER_TYPES)[number];
export type ProjectLink = { label: string; url: string };

const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

const linkUrl = z
	.string()
	.trim()
	.min(1, 'Every link needs a url')
	.max(2000)
	.refine((value) => {
		try {
			return ALLOWED_LINK_PROTOCOLS.has(new URL(value).protocol);
		} catch {
			return false;
		}
	}, 'Link urls must be absolute http(s) or mailto urls');

const projectLinkSchema = z
	.object({
		label: z.string().trim().min(1, 'Every link needs a label').max(100),
		url: linkUrl
	})
	.strict();

const projectLinksSchema = z.array(projectLinkSchema).max(20, 'At most 20 links per project');

/**
 * Parse links already stored in the database. Never throws: one malformed row
 * should not 500 a whole page. Invalid entries are dropped and logged.
 */
export function parseProjectLinks(value: string): ProjectLink[] {
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		console.warn('[projects] stored links are not valid JSON; rendering none');
		return [];
	}
	if (!Array.isArray(parsed)) {
		console.warn('[projects] stored links are not an array; rendering none');
		return [];
	}

	const links: ProjectLink[] = [];
	for (const entry of parsed) {
		const result = projectLinkSchema.safeParse(entry);
		if (result.success) links.push(result.data);
	}
	if (links.length !== parsed.length) {
		console.warn(`[projects] dropped ${parsed.length - links.length} invalid stored link(s)`);
	}
	return links;
}

export type ProjectFormValues = {
	title: string;
	description: string;
	category: ProjectCategory;
	ownerType: ProjectOwnerType;
	ownerId: string;
	image: string;
	links: string;
	featured: boolean;
	sortOrder: number;
};

export type ProjectFormResult =
	| { ok: true; values: ProjectFormValues }
	| { ok: false; error: string };

function describeLinksIssue(issue: z.core.$ZodIssue): string {
	const [index, field] = issue.path;
	if (typeof index === 'number') {
		const where = typeof field === 'string' ? `link ${index + 1} (${field})` : `link ${index + 1}`;
		if (issue.code === 'unrecognized_keys') {
			return `Links: ${where} has unexpected fields — only label and url are allowed`;
		}
		return `Links: ${where} — ${issue.message}`;
	}
	return `Links: ${issue.message}`;
}

/** Validate the admin project form. Unknown enum values are rejected, not cast. */
export function parseProjectForm(data: FormData, fallbackOwnerId: string): ProjectFormResult {
	const title = formString(data, 'title').trim();
	if (!title) return { ok: false, error: 'Title is required' };

	const category = formString(data, 'category').trim() || 'other';
	if (!(PROJECT_CATEGORIES as readonly string[]).includes(category)) {
		return { ok: false, error: `Category must be one of: ${PROJECT_CATEGORIES.join(', ')}` };
	}

	const ownerType = formString(data, 'ownerType').trim() || 'mine';
	if (!(PROJECT_OWNER_TYPES as readonly string[]).includes(ownerType)) {
		return { ok: false, error: `Owner type must be one of: ${PROJECT_OWNER_TYPES.join(', ')}` };
	}

	const linksRaw = formString(data, 'links').trim() || '[]';
	let linksJson: unknown;
	try {
		linksJson = JSON.parse(linksRaw);
	} catch {
		return { ok: false, error: 'Links must be valid JSON' };
	}
	const links = projectLinksSchema.safeParse(linksJson);
	if (!links.success) {
		if (!Array.isArray(linksJson)) {
			return { ok: false, error: 'Links must be a JSON array of { "label", "url" } objects' };
		}
		return { ok: false, error: describeLinksIssue(links.error.issues[0]) };
	}

	const sortOrder = Number.parseInt(formString(data, 'sortOrder'), 10);

	return {
		ok: true,
		values: {
			title,
			description: formString(data, 'description').trim(),
			category: category as ProjectCategory,
			ownerType: ownerType as ProjectOwnerType,
			ownerId: formString(data, 'ownerId').trim() || fallbackOwnerId,
			image: formString(data, 'image').trim(),
			links: JSON.stringify(links.data),
			featured: data.get('featured') === 'true',
			sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0
		}
	};
}
