import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { deleteFromBunnyCDN, extractFilenameFromUrl } from "@/lib/bunnycdn";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const mediaId = parseInt(id, 10);
    if (isNaN(mediaId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [record] = await db
      .select()
      .from(media)
      .where(eq(media.id, mediaId))
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Delete from BunnyCDN
    const filename = extractFilenameFromUrl(record.url) ?? record.filename;
    await deleteFromBunnyCDN(filename);

    // Delete from db
    await db.delete(media).where(eq(media.id, mediaId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/media/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 },
    );
  }
}
