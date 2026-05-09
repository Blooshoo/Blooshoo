import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { messages } from '$lib/server/db/schema';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const contactSchema = z.object({
	name: z.string().min(1).max(100),
	email: z.string().email(),
	message: z.string().min(1).max(5000),
	website: z.string().max(0).optional(), // honeypot
	num1: z.coerce.number(),
	num2: z.coerce.number(),
	answer: z.coerce.number()
});

export const load: PageServerLoad = async () => {
	// Generate server-side math challenge numbers
	const num1 = Math.floor(Math.random() * 10) + 1;
	const num2 = Math.floor(Math.random() * 10) + 1;
	return { num1, num2 };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const result = contactSchema.safeParse({
			name: data.get('name'),
			email: data.get('email'),
			message: data.get('message'),
			website: data.get('website'),
			num1: data.get('num1'),
			num2: data.get('num2'),
			answer: data.get('answer')
		});

		if (!result.success) {
			return fail(400, { error: result.error.issues[0].message });
		}

		const { name, email, message, website, num1, num2, answer } = result.data;

		// Honeypot check
		if (website && website.length > 0) {
			return fail(400, { error: 'Spam detected' });
		}

		// Math challenge check
		if (num1 + num2 !== answer) {
			return fail(400, { error: 'Incorrect math challenge answer' });
		}

		await db.insert(messages).values({ name, email, message });

		return { success: true };
	}
};
