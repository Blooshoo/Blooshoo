import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { MessageCard } from "./message-card";

export const metadata = {
  title: "Messages | Admin",
};

export default async function MessagesPage() {
  const allMessages = await db
    .select()
    .from(messages)
    .orderBy(desc(messages.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Messages</h1>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm">
        {allMessages.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No messages yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {allMessages.map((msg) => (
              <MessageCard key={msg.id} msg={msg} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
