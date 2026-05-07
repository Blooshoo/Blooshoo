"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function markAsReplied(id: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");

  await db
    .update(messages)
    .set({ status: "replied" })
    .where(eq(messages.id, id));

  revalidatePath("/bloo/messages");
}

export async function deleteMessage(id: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Unauthorized");

  await db.delete(messages).where(eq(messages.id, id));

  revalidatePath("/bloo/messages");
}
