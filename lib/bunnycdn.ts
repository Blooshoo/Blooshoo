const STORAGE_ZONE = process.env.BUNNYCDN_STORAGE_ZONE_NAME!;
const STORAGE_API_KEY = process.env.BUNNYCDN_STORAGE_API_KEY!;
const PULL_ZONE_URL = process.env.BUNNYCDN_PULL_ZONE_URL!;
const REGION = process.env.BUNNYCDN_STORAGE_REGION || "de";

const REGION_HOSTS: Record<string, string> = {
  de: "storage.bunnycdn.com",
  ny: "ny.storage.bunnycdn.com",
  la: "la.storage.bunnycdn.com",
  sg: "sg.storage.bunnycdn.com",
  syd: "syd.storage.bunnycdn.com",
};

function getStorageHost(): string {
  return REGION_HOSTS[REGION] ?? REGION_HOSTS.de;
}

export async function uploadToBunnyCDN(
  buffer: ArrayBuffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const host = getStorageHost();
  const url = `https://${host}/${STORAGE_ZONE}/${filename}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: STORAGE_API_KEY,
      "Content-Type": mimeType,
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`BunnyCDN upload failed: ${res.status} ${text}`);
  }

  return `${PULL_ZONE_URL.replace(/\/$/, "")}/${filename}`;
}

export async function deleteFromBunnyCDN(filename: string): Promise<void> {
  const host = getStorageHost();
  const url = `https://${host}/${STORAGE_ZONE}/${filename}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: { AccessKey: STORAGE_API_KEY },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error(`BunnyCDN delete failed: ${res.status}`);
  }
}

export function getBunnyCDNUrl(filename: string): string {
  return `${PULL_ZONE_URL.replace(/\/$/, "")}/${filename}`;
}

export function extractFilenameFromUrl(url: string): string | null {
  const base = PULL_ZONE_URL.replace(/\/$/, "");
  if (!url.startsWith(base)) return null;
  return url.slice(base.length + 1);
}
