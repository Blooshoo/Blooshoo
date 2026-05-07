import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { improveWriting } from "@/lib/deepseek";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const result = await improveWriting(text);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("POST /api/ai/improve error:", error);
    return NextResponse.json(
      { error: "Failed to improve writing" },
      { status: 500 },
    );
  }
}
