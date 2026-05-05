import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    // Protect all /bloo routes EXCEPT /bloo/login
    "/bloo",
    "/bloo/((?!login).*)",
  ],
};
