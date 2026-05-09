import { auth } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session?.user) {
		const u = session.user as {
			id: string;
			username?: string;
			displayName?: string;
			name?: string;
			role?: string;
			email: string;
		};
		event.locals.user = {
			id: u.id,
			username: u.username ?? u.email.split('@')[0],
			displayName: u.displayName ?? u.name ?? u.username ?? u.email,
			role: (u.role as 'admin' | 'contributor') ?? 'contributor',
			email: u.email
		};
	} else {
		event.locals.user = null;
	}

	// Handle better-auth API routes
	if (event.url.pathname.startsWith('/api/auth')) {
		return auth.handler(event.request);
	}

	return resolve(event);
};
