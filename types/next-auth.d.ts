import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      displayName: string;
      role: "admin" | "contributor";
    } & DefaultSession["user"];
  }

  interface User {
    displayName: string;
    role: "admin" | "contributor";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    displayName: string;
    role: "admin" | "contributor";
  }
}
