"use server";

import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function markAsReplied(id: number) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db
    .update(messages)
    .set({ status: "replied" })
    .where(eq(messages.id, id));

  revalidatePath("/bloo/messages");
}

export async function deleteMessage(id: number) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.delete(messages).where(eq(messages.id, id));

  revalidatePath("/bloo/messages");
}
