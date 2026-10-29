import { describe, expect, it } from 'vitest';
import {
	TOKEN_TTL_MS,
	createContactChallenge,
	verifyContactChallenge
} from './contact-challenge';

const secret = 'test-secret-that-is-at-least-32-characters';

describe('contact challenge', () => {
	it('accepts the right answer once', () => {
		const c = createContactChallenge(secret);
		expect(verifyContactChallenge(c.token, c.num1 + c.num2, secret)).toEqual({ ok: true });
		expect(verifyContactChallenge(c.token, c.num1 + c.num2, secret)).toEqual({
			ok: false,
			reason: 'used'
		});
	});

	it('rejects a wrong answer and burns the token', () => {
		const c = createContactChallenge(secret);
		expect(verifyContactChallenge(c.token, c.num1 + c.num2 + 1, secret)).toEqual({
			ok: false,
			reason: 'wrong'
		});
		expect(verifyContactChallenge(c.token, c.num1 + c.num2, secret).ok).toBe(false);
	});

	it('rejects the old 0 + 0 = 0 bypass (no token)', () => {
		expect(verifyContactChallenge('', 0, secret)).toEqual({ ok: false, reason: 'invalid' });
	});

	it('rejects a token with a forged payload', () => {
		const c = createContactChallenge(secret);
		const [, sig] = c.token.split('.');
		const forged = Buffer.from(JSON.stringify({ a: 0, e: Date.now() + 60_000, n: 'x' })).toString(
			'base64url'
		);
		expect(verifyContactChallenge(`${forged}.${sig}`, 0, secret)).toEqual({
			ok: false,
			reason: 'invalid'
		});
	});

	it('rejects a token signed with a different secret', () => {
		const c = createContactChallenge('some-other-secret-also-32-characters!!');
		expect(verifyContactChallenge(c.token, c.num1 + c.num2, secret).ok).toBe(false);
	});

	it('rejects expired tokens', () => {
		const now = Date.now();
		const c = createContactChallenge(secret, now);
		expect(verifyContactChallenge(c.token, c.num1 + c.num2, secret, now + TOKEN_TTL_MS)).toEqual({
			ok: false,
			reason: 'expired'
		});
	});

	it('only displays numbers from 1 to 10', () => {
		for (let i = 0; i < 200; i++) {
			const { num1, num2 } = createContactChallenge(secret);
			expect(num1).toBeGreaterThanOrEqual(1);
			expect(num1).toBeLessThanOrEqual(10);
			expect(num2).toBeGreaterThanOrEqual(1);
			expect(num2).toBeLessThanOrEqual(10);
		}
	});
});
