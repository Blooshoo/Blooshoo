import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Allow access to /bloo/login without auth
	if (url.pathname === '/bloo/login') return {};

	if (!locals.user) {
		redirect(302, '/bloo/login');
	}

	// The whole /bloo area is admin-only. Contributors have no scoped
	// permissions in this app, so anything short of admin is redirected out.
	if (locals.user.role !== 'admin') {
		redirect(302, '/');
	}

	return { user: locals.user };
};
