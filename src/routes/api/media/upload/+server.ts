import { json, error } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { media } from "$lib/server/db/schema";
import { uploadToBunnyCDN, getBunnyCDNUrl } from "$lib/server/bunnycdn";
import { check as rateLimit } from "$lib/server/rate-limit";
import type { RequestHandler } from "./$types";

// image/svg+xml is deliberately NOT allowed: SVG can carry script, and
// served from the CDN origin it becomes an XSS/phishing vector.
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

/**
 * Magic-byte sniffing. Never trust the client-declared MIME type alone:
 * an attacker can name an HTML/SVG file "image/png". Returns the sniffed
 * MIME type, or null if the bytes match nothing in the allowlist.
 */
function sniffMimeType(bytes: Uint8Array): string | null {
  const b = bytes;
  const ascii = (s: string, offset: number) => {
    for (let i = 0; i < s.length; i++) {
      if (b[offset + i] !== s.charCodeAt(i)) return false;
    }
    return true;
  };

  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && ascii("\x89PNG\r\n\x1a\n", 0)) return "image/png";
  if (b.length >= 6 && ascii("GIF8", 0) && (b[4] === 0x37 || b[4] === 0x39)) return "image/gif";
  if (b.length >= 12 && ascii("RIFF", 0) && ascii("WEBP", 8)) return "image/webp";
  if (b.length >= 12 && ascii("ftyp", 4)) return "video/mp4";
  if (b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3)
    return "video/webm";
  if (b.length >= 5 && ascii("%PDF-", 0)) return "application/pdf";

  return null;
}

export const POST: RequestHandler = async ({
  request,
  locals,
  getClientAddress,
}) => {
  // Admin-only: this is a +server.ts endpoint and does not inherit the
  // /bloo layout gate. The whole admin area is admin-only.
  if (locals.user?.role !== "admin") error(403, "Forbidden");

  const ip = getClientAddress();
  const rl = rateLimit({ key: `media-upload:${ip}`, max: 20, windowSec: 300 });
  if (!rl.allowed) error(429, "Too many uploads. Please try again later.");

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) error(400, "No file provided");
  if (!ALLOWED_MIME_TYPES.has(file.type)) error(400, "File type not allowed");
  if (file.size > MAX_SIZE) error(400, "File too large (max 50 MB)");

  const arrayBuffer = await file.arrayBuffer();

  // Verify the declared type against the actual bytes
  const sniffed = sniffMimeType(new Uint8Array(arrayBuffer));
  if (!sniffed || sniffed !== file.type) {
    error(400, "File contents do not match the declared type");
  }

  const safeName = file.name.replaceAll(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${Date.now()}-${safeName}`;

  await uploadToBunnyCDN(arrayBuffer, filename, sniffed);

  const url = getBunnyCDNUrl(filename);

  const [inserted] = await db
    .insert(media)
    .values({
      filename,
      originalName: file.name,
      url,
      mimeType: sniffed,
      size: file.size,
    })
    .returning();

  return json({ url, id: inserted.id });
};
