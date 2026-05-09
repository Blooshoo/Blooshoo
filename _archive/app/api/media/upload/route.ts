import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { uploadToBunnyCDN } from "@/lib/bunnycdn";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const originalName = file.name;
    const mimeType = file.type;
    const size = file.size;

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 },
      );
    }
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 20 MB)" },
        { status: 400 },
      );
    }

    // Sanitize original name for filename
    const sanitized = originalName
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "-")
      .replace(/-+/g, "-");

    const filename = `${Date.now()}-${sanitized}`;

    const buffer = await file.arrayBuffer();
    const url = await uploadToBunnyCDN(buffer, filename, mimeType);

    const [record] = await db
      .insert(media)
      .values({
        filename,
        originalName,
        url,
        mimeType,
        size,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      { id: record.id, url: record.url, filename: record.filename },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/media/upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
