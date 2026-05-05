import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Users ────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "contributor"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
});

// ─── Posts ────────────────────────────────────────────────────────────
export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull().default(""),
  excerpt: text("excerpt").notNull().default(""),
  coverImage: text("cover_image"),
  status: text("status", { enum: ["draft", "published"] })
    .notNull()
    .default("draft"),
  tags: text("tags").notNull().default("[]"),
  authorId: integer("author_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
});

// ─── Projects ─────────────────────────────────────────────────────────
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category", {
    enum: ["website", "game", "mod", "other"],
  }).notNull(),
  links: text("links").notNull().default("[]"), // JSON array of { label, url }
  image: text("image"),
  ownerType: text("owner_type", { enum: ["mine", "friend"] }).notNull(),
  ownerName: text("owner_name"),
  ownerId: integer("owner_id"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
});

// ─── Media ────────────────────────────────────────────────────────────
export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  url: text("url").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
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

// ─── Messages ─────────────────────────────────────────────────────────
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  status: text("status", { enum: ["unread", "read", "replied"] })
    .notNull()
    .default("unread"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$default(() => new Date()),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
