import { describe, expect, it, vi } from 'vitest';
import { parseProjectForm, parseProjectLinks } from './project-utils';

function form(fields: Record<string, string>): FormData {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) data.set(key, value);
	return data;
}

const valid = {
	title: 'Cool game',
	category: 'game',
	ownerType: 'collab',
	links: '[{"label":"Play","url":"https://example.com/play"}]'
};

describe('parseProjectForm', () => {
	it('accepts a valid form, including collab owner type', () => {
		const result = parseProjectForm(form(valid), 'user-1');
		expect(result).toEqual({
			ok: true,
			values: expect.objectContaining({
				title: 'Cool game',
				category: 'game',
				ownerType: 'collab',
				ownerId: 'user-1',
				links: '[{"label":"Play","url":"https://example.com/play"}]',
				featured: false,
				sortOrder: 0
			})
		});
	});

	it('defaults blank category/owner type/links', () => {
		const result = parseProjectForm(form({ title: 'x' }), 'u');
		expect(result.ok && result.values).toMatchObject({
			category: 'other',
			ownerType: 'mine',
			links: '[]'
		});
	});

	it.each([
		['category', 'Web'],
		['ownerType', 'admin']
	])('rejects unknown %s values instead of casting them', (field, value) => {
		const result = parseProjectForm(form({ ...valid, [field]: value }), 'u');
		expect(result.ok).toBe(false);
	});

	it.each([
		['not json', 'nope', /valid JSON/],
		['an object', '{}', /JSON array/],
		['missing url', '[{"label":"x"}]', /link 1 \(url\)/],
		['extra fields', '[{"label":"x","url":"https://a.b","evil":1}]', /unexpected fields/],
		['javascript: url', '[{"label":"x","url":"javascript:alert(1)"}]', /http\(s\) or mailto/],
		['relative url', '[{"label":"x","url":"/foo"}]', /http\(s\) or mailto/],
		['non-string label', '[{"label":5,"url":"https://a.b"}]', /link 1 \(label\)/]
	])('rejects links that are %s', (_name, links, message) => {
		const result = parseProjectForm(form({ ...valid, links }), 'u');
		expect(result.ok).toBe(false);
		expect(!result.ok && result.error).toMatch(message);
	});

	it('requires a title', () => {
		expect(parseProjectForm(form({ ...valid, title: '  ' }), 'u')).toEqual({
			ok: false,
			error: 'Title is required'
		});
	});
});

describe('parseProjectLinks', () => {
	it('returns valid stored links', () => {
		expect(parseProjectLinks('[{"label":"a","url":"https://a.b"}]')).toEqual([
			{ label: 'a', url: 'https://a.b' }
		]);
	});

	it.each(['not json', '{}', 'null', '"str"'])('falls back to [] for %s', (value) => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(parseProjectLinks(value)).toEqual([]);
	});

	it('drops individual malformed entries', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(
			parseProjectLinks('[{"label":"ok","url":"https://a.b"},{},{"label":"x","url":"javascript:1"}]')
		).toEqual([{ label: 'ok', url: 'https://a.b' }]);
	});
});
