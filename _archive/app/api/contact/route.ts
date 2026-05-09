import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  message: z.string().min(1, "Message is required").max(5000),
  honeypot: z.string().max(0, "Bot detected").optional(),
  num1: z.number(),
  num2: z.number(),
  answer: z.number()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { name, email, message, honeypot, num1, num2, answer } = result.data;

    // Honeypot check
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json({ error: "Spam detected" }, { status: 400 });
    }

    // Math check
    if (num1 + num2 !== answer) {
      return NextResponse.json({ error: "Incorrect math challenge answer" }, { status: 400 });
    }

    // Insert into db
    await db.insert(messages).values({
      name,
      email,
      message,
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
