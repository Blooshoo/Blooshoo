import { describe, expect, it } from 'vitest';
import { normalizePostSlug, parsePostTags } from './post-utils';

describe('parsePostTags', () => {
	it('keeps string tags', () => {
		expect(parsePostTags('["a","b"]')).toEqual(['a', 'b']);
	});

	it.each(['nope', '{}', 'null', '[1, "", "ok"]'])('never throws on %s', (value) => {
		expect(() => parsePostTags(value)).not.toThrow();
		expect(parsePostTags(value).every((t) => typeof t === 'string' && t.length > 0)).toBe(true);
	});
});

describe('normalizePostSlug', () => {
	it('slugifies titles', () => {
		expect(normalizePostSlug('  Hello, World!! ')).toBe('hello-world');
	});
});
