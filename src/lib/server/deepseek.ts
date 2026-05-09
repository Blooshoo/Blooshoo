import { env } from '$env/dynamic/private';

const { DEEPSEEK_API_KEY } = env;

const BASE_URL = 'https://api.deepseek.com/v1';

export type DeepSeekModel = 'deepseek-chat' | 'deepseek-reasoner';

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface DeepSeekResponse {
	choices: Array<{
		message: { role: string; content: string };
	}>;
}

export async function chatCompletion(
	messages: ChatMessage[],
	options: {
		model?: DeepSeekModel;
		temperature?: number;
		max_tokens?: number;
	} = {}
): Promise<string> {
	const res = await fetch(`${BASE_URL}/chat/completions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${DEEPSEEK_API_KEY}`
		},
		body: JSON.stringify({
			model: options.model ?? 'deepseek-chat',
			messages,
			temperature: options.temperature ?? 0.7,
			max_tokens: options.max_tokens ?? 2048,
			stream: false
		})
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`DeepSeek API error ${res.status}: ${err}`);
	}

	const data: DeepSeekResponse = await res.json();
	return data.choices[0]?.message?.content ?? '';
}

export async function generateExcerpt(title: string, content: string): Promise<string> {
	return chatCompletion([
		{
			role: 'system',
			content:
				'You are a concise technical writer. Generate a 1-2 sentence excerpt for a blog post. Return only the excerpt text, no quotes or extra formatting.'
		},
		{
			role: 'user',
			content: `Title: ${title}\n\nContent (first 1000 chars): ${content.slice(0, 1000)}`
		}
	]);
}

export async function suggestTags(title: string, content: string): Promise<string[]> {
	const result = await chatCompletion([
		{
			role: 'system',
			content:
				'You are a blog content categorizer. Suggest 3-6 relevant tags for a blog post. Return ONLY a JSON array of lowercase tag strings, nothing else. Example: ["typescript", "sveltekit", "web"]'
		},
		{
			role: 'user',
			content: `Title: ${title}\n\nContent: ${content.slice(0, 2000)}`
		}
	]);

	try {
		return JSON.parse(result) as string[];
	} catch {
		return [];
	}
}

export async function improveWriting(text: string): Promise<string> {
	return chatCompletion([
		{
			role: 'system',
			content:
				'You are a technical writing editor. Improve the clarity, flow, and correctness of the provided text. Preserve the author\'s voice and intent. Return only the improved text.'
		},
		{ role: 'user', content: text }
	]);
}
