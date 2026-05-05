import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/bloo/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.displayName = (user as any).displayName ?? "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role ?? "contributor";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.displayName = token.displayName as string;
        session.user.role =
          (token.role as "admin" | "contributor") || "contributor";
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isBlooPath = nextUrl.pathname.startsWith("/bloo");
      const isLoginPage = nextUrl.pathname === "/bloo/login";

      // Already logged in → redirect away from login page
      if (isLoginPage && isLoggedIn) {
        return Response.redirect(new URL("/bloo", nextUrl));
      }

      // Not logged in + protected bloo path → NextAuth will redirect to signIn page
      if (isBlooPath && !isLoginPage && !isLoggedIn) return false;

      return true;
    },
  },
  providers: [],
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
