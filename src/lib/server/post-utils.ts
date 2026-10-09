export function normalizePostSlug(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 120);
}

export function derivePostExcerpt(content: string): string {
	const plainText = content
		.replace(/<br\s*\/?>(?=\S)/gi, ' ')
		.replace(/<\/(p|h[1-6]|li|blockquote)>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	if (plainText.length <= 180) return plainText;
	return `${plainText.slice(0, 177).trimEnd()}…`;
}

export function formString(data: FormData, name: string): string {
	const value = data.get(name);
	return typeof value === 'string' ? value : '';
}

export function parsePostTags(value: string): string[] {
	try {
		const parsed: unknown = JSON.parse(value);
		if (!Array.isArray(parsed)) return [];

		return parsed.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
	} catch {
		return [];
	}
}

export function isUniqueConstraintError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	return 'code' in error && error.code === '23505';
}

export function databaseErrorCode(error: unknown): string | undefined {
	if (!error || typeof error !== 'object' || !('code' in error)) return undefined;
	const code = error.code;
	return typeof code === 'string' ? code : undefined;
}
