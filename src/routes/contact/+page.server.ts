import { fail } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { messages } from "$lib/server/db/schema";
import { recordBotAttempt } from "$lib/server/bot-counter";
import { check as rateLimit } from "$lib/server/rate-limit";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
  num1: z.coerce.number(),
  num2: z.coerce.number(),
  answer: z.coerce.number(),
});

export const load: PageServerLoad = async () => {
  // Generate server-side math challenge numbers
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  return { num1, num2 };
};

export const actions: Actions = {
  default: async ({ request, getClientAddress }) => {
    const ip = getClientAddress();
    const rl = rateLimit({ key: `contact:${ip}`, max: 5, windowSec: 300 });
    if (!rl.allowed) {
      return fail(429, { error: "Too many messages. Please try again later." });
    }
    const data = await request.formData();

    // Quietly accept but discard submissions that fill either trap. The
    // existing rate limit above caps one address at five counts per five
    // minutes, so a noisy bot cannot make the dashboard number race freely.
    const website = data.get("website");
    const agentCanary = data.get("agentCanary");
    if (
      (typeof website === "string" && website.trim().length > 0) ||
      (typeof agentCanary === "string" && agentCanary.trim().length > 0)
    ) {
      await recordBotAttempt();
      return { success: true };
    }

    const result = contactSchema.safeParse({
      name: data.get("name"),
      email: data.get("email"),
      message: data.get("message"),
      num1: data.get("num1"),
      num2: data.get("num2"),
      answer: data.get("answer"),
    });

    if (!result.success) {
      return fail(400, { error: result.error.issues[0].message });
    }

    const { name, email, message, num1, num2, answer } = result.data;

    // Math challenge check
    if (num1 + num2 !== answer) {
      return fail(400, { error: "Incorrect math challenge answer" });
    }

    await db.insert(messages).values({ name, email, message });

    return { success: true };
  },
};
