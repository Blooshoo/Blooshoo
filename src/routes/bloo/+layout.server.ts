import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Allow access to /bloo/login without auth
	if (url.pathname === '/bloo/login') return {};

	if (!locals.user) {
		redirect(302, '/bloo/login');
	}

	return { user: locals.user };
};
