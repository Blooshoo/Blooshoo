import { fail } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { messages } from "$lib/server/db/schema";
import { recordBotAttempt } from "$lib/server/bot-counter";
import { check as rateLimit } from "$lib/server/rate-limit";
import {
  createContactChallenge,
  verifyContactChallenge,
} from "$lib/server/contact-challenge";
import { requireEnv } from "$lib/server/env";
import { z } from "zod";
import type { Actions, PageServerLoad } from "./$types";

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
  challenge: z.string().min(1).max(500),
  answer: z.coerce.number().int(),
});

const challengeErrors = {
  invalid: "The math check was tampered with or is malformed. Please try again.",
  expired: "The math check expired. Here's a fresh one.",
  used: "That math check was already used. Here's a fresh one.",
  wrong: "Incorrect math challenge answer",
} as const;

// AUTH_SECRET is already required (and length-checked) at boot by auth.ts.
const secret = () => requireEnv("AUTH_SECRET");

// Failed submissions get a fresh challenge: the old token is single-use.
function failWithChallenge(status: number, error: string) {
  return fail(status, { error, challenge: createContactChallenge(secret()) });
}

export const load: PageServerLoad = async () => {
  return { challenge: createContactChallenge(secret()) };
};

export const actions: Actions = {
  default: async ({ request, getClientAddress }) => {
    const ip = getClientAddress();
    const rl = rateLimit({ key: `contact:${ip}`, max: 5, windowSec: 300 });
    if (!rl.allowed) {
      return failWithChallenge(429, "Too many messages. Please try again later.");
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
      challenge: data.get("challenge"),
      answer: data.get("answer"),
    });

    if (!result.success) {
      return failWithChallenge(400, result.error.issues[0].message);
    }

    const { name, email, message, challenge, answer } = result.data;

    const verdict = verifyContactChallenge(challenge, answer, secret());
    if (!verdict.ok) {
      return failWithChallenge(400, challengeErrors[verdict.reason]);
    }

    await db.insert(messages).values({ name, email, message });

    return { success: true };
  },
};
