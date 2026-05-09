import { pgTable, text, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";

// ─── Users ────────────────────────────────────────────────────────────
// Note: email, emailVerified, image, and updatedAt are required by
// better-auth's core schema. email is auto-populated from username
// by the username plugin; emailVerified defaults to true since
// this is a private admin panel without email verification.
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash"),
  role: text("role", { enum: ["admin", "contributor"] as const }).notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .$default(() => new Date()),
  // ── better-auth compatibility columns ──
  email: text("email").unique(),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  updatedAt: timestamp("updated_at").$default(() => new Date()),
});

// ─── Auth (better-auth) ───────────────────────────────────────────────
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// ─── Posts ────────────────────────────────────────────────────────────
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull().default(""),
  excerpt: text("excerpt").notNull().default(""),
  coverImage: text("cover_image"),
  status: text("status", { enum: ["draft", "published"] as const })
    .notNull()
    .default("draft"),
  tags: text("tags").notNull().default("[]"),
  authorId: text("author_id"),
  createdAt: timestamp("created_at")
    .notNull()
    .$default(() => new Date()),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$default(() => new Date()),
});

// ─── Projects ─────────────────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category", {
    enum: ["website", "game", "mod", "other"] as const,
  }).notNull(),
  links: text("links").notNull().default("[]"),
  image: text("image"),
  ownerType: text("owner_type", { enum: ["mine", "friend"] as const }).notNull(),
  ownerName: text("owner_name"),
  ownerId: text("owner_id"),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at")
    .notNull()
    .$default(() => new Date()),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$default(() => new Date()),
});

// ─── Media ────────────────────────────────────────────────────────────
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .$default(() => new Date()),
});

// ─── Messages ─────────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  status: text("status", { enum: ["unread", "read", "replied"] as const })
    .notNull()
    .default("unread"),
  createdAt: timestamp("created_at")
    .notNull()
    .$default(() => new Date()),
});

// ─── Types ────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
