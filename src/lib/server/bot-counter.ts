import { sql } from 'drizzle-orm';
import { db } from './db';
import { botStats } from './db/schema';

const COUNTER_ROW_ID = 1;

export async function recordBotAttempt(): Promise<void> {
	await db
		.insert(botStats)
		.values({ id: COUNTER_ROW_ID, attempts: 1 })
		.onConflictDoUpdate({
			target: botStats.id,
			set: {
				attempts: sql`${botStats.attempts} + 1`,
				updatedAt: new Date()
			}
		});
}
