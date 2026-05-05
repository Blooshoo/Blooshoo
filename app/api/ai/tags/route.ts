import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { suggestTags } from "@/lib/deepseek";

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

    const tags = await suggestTags(title, content);
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("POST /api/ai/tags error:", error);
    return NextResponse.json({ error: "Failed to suggest tags" }, { status: 500 });
  }
}
