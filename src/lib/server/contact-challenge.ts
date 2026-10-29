import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

/**
 * Server-verifiable math challenge for the contact form.
 *
 * The expected answer never reaches the browser in usable form: the page gets
 * the two numbers to display plus an HMAC-signed token carrying the answer,
 * an expiry, and a nonce. On submit the server checks the signature, the
 * expiry, the answer, and that the nonce hasn't been used before. Tampering
 * with the numbers or minting a token without the secret both fail.
 *
 * Like the rate limiter, the used-nonce set is in-memory — fine for the
 * single-node adapter-node deployment. A restart forgets used nonces, but
 * tokens also expire, so replay is bounded by TOKEN_TTL_MS either way.
 */

export const TOKEN_TTL_MS = 30 * 60 * 1000;

const usedNonces = new Map<string, number>();

void setInterval(() => {
	const now = Date.now();
	for (const [nonce, expiresAt] of usedNonces) {
		if (now >= expiresAt) usedNonces.delete(nonce);
	}
}, 60_000).unref?.();

type Payload = { a: number; e: number; n: string };

export type ContactChallenge = { num1: number; num2: number; token: string };

export type ChallengeResult =
	| { ok: true }
	| { ok: false; reason: 'invalid' | 'expired' | 'used' | 'wrong' };

function sign(body: string, secret: string): string {
	return createHmac('sha256', secret).update(`contact-challenge:${body}`).digest('base64url');
}

export function createContactChallenge(secret: string, now = Date.now()): ContactChallenge {
	const num1 = randomInt(1, 11);
	const num2 = randomInt(1, 11);
	const payload: Payload = { a: num1 + num2, e: now + TOKEN_TTL_MS, n: randomBytes(12).toString('base64url') };
	const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
	return { num1, num2, token: `${body}.${sign(body, secret)}` };
}

export function verifyContactChallenge(
	token: string,
	answer: number,
	secret: string,
	now = Date.now()
): ChallengeResult {
	const [body, signature, extra] = token.split('.');
	if (!body || !signature || extra !== undefined) return { ok: false, reason: 'invalid' };

	const expected = Buffer.from(sign(body, secret));
	const actual = Buffer.from(signature);
	if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
		return { ok: false, reason: 'invalid' };
	}

	let payload: Payload;
	try {
		payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
	} catch {
		return { ok: false, reason: 'invalid' };
	}
	if (
		typeof payload?.a !== 'number' ||
		typeof payload.e !== 'number' ||
		typeof payload.n !== 'string'
	) {
		return { ok: false, reason: 'invalid' };
	}

	if (now >= payload.e) return { ok: false, reason: 'expired' };
	if (usedNonces.has(payload.n)) return { ok: false, reason: 'used' };

	// Burn the nonce on any genuine attempt, right or wrong, so one token
	// can't be used to brute-force the (tiny) answer space.
	usedNonces.set(payload.n, payload.e);
	return answer === payload.a ? { ok: true } : { ok: false, reason: 'wrong' };
}
