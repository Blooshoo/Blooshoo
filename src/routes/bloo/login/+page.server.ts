import { redirect, fail } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(302, '/bloo');
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		const result = await auth.api.signInEmail({ body: { email, password } });

		if (!result || 'error' in result) {
			return fail(401, { error: 'Invalid email or password' });
		}

		redirect(302, '/bloo');
	}
};
