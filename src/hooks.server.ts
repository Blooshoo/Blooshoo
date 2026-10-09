import { eq } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { session as sessionTable } from '$lib/server/db/schema';
import {
  ensureDiscordAllowlistSeeded,
  getDiscordAccountId,
  isDiscordIdAllowed,
  OWNER_DISCORD_ID,
} from '$lib/server/discord-access';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers });

  if (session?.user) {
    await ensureDiscordAllowlistSeeded();
    const discordId = await getDiscordAccountId(session.user.id);

    if (!discordId || !(await isDiscordIdAllowed(discordId))) {
      const sessionId = (session as { session?: { id?: string } }).session?.id;
      if (sessionId) {
        await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
      }
      event.locals.user = null;
    } else {
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
        username: u.username ?? u.email.split("@")[0],
        displayName: u.displayName ?? u.name ?? u.username ?? u.email,
        // Keep the owner usable even if an older session cached a stale role.
        role: discordId === OWNER_DISCORD_ID
          ? "admin"
          : (u.role as "admin" | "contributor") ?? "contributor",
        email: u.email,
      };
    }
  } else {
    event.locals.user = null;
  }

  // Centralized authorization: every non-GET request under /bloo (form
  // actions, etc.) requires an admin session. Page loads are additionally
  // gated by the /bloo layout load. This closes the gap where a contributor
  // could POST straight to an action without ever loading the page.
  if (
    event.url.pathname.startsWith("/bloo") &&
    event.url.pathname !== "/bloo/login" &&
    event.request.method !== "GET" &&
    event.locals.user?.role !== "admin"
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  // Handle better-auth API routes
  if (event.url.pathname.startsWith("/api/auth")) {
    return auth.handler(event.request);
  }

  const response = await resolve(event);

  // ── Security headers ──────────────────────────────────────────────
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), camera=(), microphone=(), interest-cohort=()",
  );

  // Content-Security-Policy — scoped to known resources
  // Note: 'unsafe-inline' in script-src remains for now (SvelteKit's
  // inline bootstrap + runtime). adapter-node supports nonce/hash CSP via
  // kit.csp — moving off 'unsafe-inline' is tracked as future hardening.
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.deepseek.com", // kept for future bloochat BYOK
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  return response;
};
