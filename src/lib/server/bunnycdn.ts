import { env } from '$env/dynamic/private';

const BUNNYCDN_STORAGE_ZONE_NAME = env.BUNNYCDN_STORAGE_ZONE_NAME ?? '';
const BUNNYCDN_STORAGE_API_KEY = env.BUNNYCDN_STORAGE_API_KEY ?? '';
const BUNNYCDN_PULL_ZONE_URL = env.BUNNYCDN_PULL_ZONE_URL ?? '';
const BUNNYCDN_STORAGE_REGION = env.BUNNYCDN_STORAGE_REGION ?? 'de';

const REGION_HOSTS: Record<string, string> = {
	de: 'storage.bunnycdn.com',
	ny: 'ny.storage.bunnycdn.com',
	la: 'la.storage.bunnycdn.com',
	sg: 'sg.storage.bunnycdn.com',
	syd: 'syd.storage.bunnycdn.com'
};

function getStorageHost(): string {
	return REGION_HOSTS[BUNNYCDN_STORAGE_REGION] ?? REGION_HOSTS.de;
}

export async function uploadToBunnyCDN(
	buffer: ArrayBuffer,
	filename: string,
	mimeType: string
): Promise<string> {
	const host = getStorageHost();
	const url = `https://${host}/${BUNNYCDN_STORAGE_ZONE_NAME}/${filename}`;

	const res = await fetch(url, {
		method: 'PUT',
		headers: {
			AccessKey: BUNNYCDN_STORAGE_API_KEY,
			'Content-Type': mimeType
		},
		body: buffer
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`BunnyCDN upload failed: ${res.status} ${text}`);
	}

	return `${BUNNYCDN_PULL_ZONE_URL.replace(/\/$/, '')}/${filename}`;
}

export async function deleteFromBunnyCDN(filename: string): Promise<void> {
	const host = getStorageHost();
	const url = `https://${host}/${BUNNYCDN_STORAGE_ZONE_NAME}/${filename}`;

	const res = await fetch(url, {
		method: 'DELETE',
		headers: { AccessKey: BUNNYCDN_STORAGE_API_KEY }
	});

	if (!res.ok && res.status !== 404) {
		throw new Error(`BunnyCDN delete failed: ${res.status}`);
	}
}

export function getBunnyCDNUrl(filename: string): string {
	return `${BUNNYCDN_PULL_ZONE_URL.replace(/\/$/, '')}/${filename}`;
}

export function extractFilenameFromUrl(url: string): string | null {
	const base = BUNNYCDN_PULL_ZONE_URL.replace(/\/$/, '');
	if (!url.startsWith(base)) return null;
	return url.slice(base.length + 1);
}
