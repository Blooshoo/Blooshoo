import { env } from '$env/dynamic/private';

// BUNNY_CDN_URL  — storage API base, e.g. https://la.storage.bunnycdn.com/blooshoo
// BUNNY_STORAGE_HOSTNAME — pull zone host, e.g. blooshoo.b-cdn.net
// BUNNY_STORAGE_PASSWORD — read/write API key
const storageBase = (env.BUNNY_CDN_URL ?? '').replace(/\/$/, '');
const pullHost = (env.BUNNY_STORAGE_HOSTNAME ?? '').replace(/\/$/, '');
const apiKey = env.BUNNY_STORAGE_PASSWORD ?? '';

export async function uploadToBunnyCDN(
	buffer: ArrayBuffer,
	filename: string,
	mimeType: string
): Promise<string> {
	const url = `${storageBase}/${filename}`;

	const res = await fetch(url, {
		method: 'PUT',
		headers: {
			AccessKey: apiKey,
			'Content-Type': mimeType
		},
		body: buffer
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`BunnyCDN upload failed: ${res.status} ${text}`);
	}

	return `https://${pullHost}/${filename}`;
}

export async function deleteFromBunnyCDN(filename: string): Promise<void> {
	const url = `${storageBase}/${filename}`;

	const res = await fetch(url, {
		method: 'DELETE',
		headers: { AccessKey: apiKey }
	});

	if (!res.ok && res.status !== 404) {
		throw new Error(`BunnyCDN delete failed: ${res.status}`);
	}
}

export function getBunnyCDNUrl(filename: string): string {
	return `https://${pullHost}/${filename}`;
}

export function extractFilenameFromUrl(url: string): string | null {
	const prefix = `https://${pullHost}/`;
	if (!url.startsWith(prefix)) return null;
	return url.slice(prefix.length);
}
