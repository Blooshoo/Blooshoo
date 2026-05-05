import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateExcerpt } from "@/lib/deepseek";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const excerpt = await generateExcerpt(title, content);
    return NextResponse.json({ excerpt });
  } catch (error) {
    console.error("POST /api/ai/excerpt error:", error);
    return NextResponse.json({ error: "Failed to generate excerpt" }, { status: 500 });
  }
}
