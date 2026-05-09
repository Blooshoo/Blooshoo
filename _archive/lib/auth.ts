import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "./db";
import * as schema from "./db/schema";
import bcrypt from "bcryptjs";

if (!process.env.AUTH_SECRET && !process.env.SESSION_SECRET) {
  throw new Error("AUTH_SECRET environment variable is required but not set.");
}

// Discord IDs pre-approved by the admin (set ALLOWED_DISCORD_IDS in .env)
const allowedDiscordIds = new Set(
  (process.env.ALLOWED_DISCORD_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
);

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET || process.env.SESSION_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
    : [],

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users, // better-auth "user" → our "users" table
      // session, account, verification keep their default singular names
    },
  }),

  user: {
    modelName: "users",
    fields: {
      name: "displayName",
      emailVerified: "emailVerified",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "contributor",
        input: false,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh every day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minute cache
    },
  },

  rateLimit: {
    enabled: true,
    window: 60, // 60-second sliding window
    max: 10,    // max 10 auth requests per window per IP
  },

  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    },
  },

  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => {
        return bcrypt.hash(password, 12);
      },
      verify: async ({
        hash,
        password,
      }: {
        hash: string;
        password: string;
      }) => {
        return bcrypt.compare(password, hash);
      },
    },
    // Disable sign-up via better-auth — users are managed through /bloo/users
    disableSignUp: true,
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Derive a username from email prefix for OAuth sign-ups
          // (Better Auth doesn't map our custom `username` column)
          if (!user.username) {
            const derived = (user.email?.split("@")[0] ?? user.id)
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, "_");
            return { data: { ...user, username: derived } };
          }
          return { data: user };
        },
      },
    },
    account: {
      create: {
        before: async (accountData) => {
          // For Discord accounts: only allow pre-approved Discord IDs.
          // Allowed IDs can self-register via OAuth; everyone else is blocked.
          // Credential accounts are created by our /api/users route directly
          // (bypassing this hook), so this guard only applies to OAuth.
          if (
            accountData.providerId === "discord" &&
            !allowedDiscordIds.has(accountData.accountId)
          ) {
            throw new Error("Your Discord account is not authorised to access this panel.");
          }
          return { data: accountData };
        },
      },
    },
  },
});
