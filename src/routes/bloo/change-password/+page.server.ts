import { redirect, fail } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/bloo/login');

		const data = await request.formData();
		const currentPassword = data.get('currentPassword') as string;
		const newPassword = data.get('newPassword') as string;
		const confirmPassword = data.get('confirmPassword') as string;

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { error: 'All fields are required' });
		}

		if (newPassword.length < 8) {
			return fail(400, { error: 'New password must be at least 8 characters' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match' });
		}

		const result = await auth.api.changePassword({
			body: { currentPassword, newPassword, revokeOtherSessions: false },
			headers: request.headers
		});

		if (!result || 'error' in result) {
			return fail(400, { error: 'Current password is incorrect' });
		}

		return { success: true };
	}
};
