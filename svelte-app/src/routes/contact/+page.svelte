<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form } = $props<{ data: PageData; form: ActionData }>();
</script>

<svelte:head>
	<title>Contact — blooshoo</title>
	<meta name="description" content="Get in touch with blooshoo." />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-16">
	<div class="content-block">
		<div class="mb-10">
			<h1 class="text-3xl font-bold tracking-tight" style="font-family: var(--font-heading)">
				Contact
			</h1>
			<p class="mt-2 text-slate-400">Have something to say? Send me a message.</p>
		</div>

		{#if form?.success}
			<div
				class="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-6 text-center"
			>
				<p class="text-lg font-semibold text-emerald-400">Message sent!</p>
				<p class="mt-1 text-sm text-slate-400">I'll get back to you when I can.</p>
			</div>
		{:else}
			{#if form?.error}
				<div
					class="mb-6 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400"
				>
					{form.error}
				</div>
			{/if}

			<form use:enhance method="POST" class="space-y-6">
				<!-- Honeypot -->
				<div style="display: none;" aria-hidden="true">
					<label for="website">Website</label>
					<input id="website" name="website" type="text" tabindex="-1" autocomplete="off" />
				</div>

				<!-- Hidden math numbers -->
				<input type="hidden" name="num1" value={data.num1} />
				<input type="hidden" name="num2" value={data.num2} />

				<div class="space-y-2">
					<label class="label-caps" for="name">Name</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						class="input-dark"
						placeholder="Your name"
						autocomplete="name"
					/>
				</div>

				<div class="space-y-2">
					<label class="label-caps" for="email">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						class="input-dark"
						placeholder="you@example.com"
						autocomplete="email"
					/>
				</div>

				<div class="space-y-2">
					<label class="label-caps" for="message">Message</label>
					<textarea
						id="message"
						name="message"
						required
						rows="6"
						class="input-dark resize-none"
						placeholder="What's on your mind?"
					></textarea>
				</div>

				<div class="space-y-2">
					<label class="label-caps" for="answer">
						Quick check: what is {data.num1} + {data.num2}?
					</label>
					<input
						id="answer"
						name="answer"
						type="number"
						required
						class="input-dark w-32"
						placeholder="Answer"
					/>
				</div>

				<button type="submit" class="btn-cyan">Send message</button>
			</form>
		{/if}
	</div>
</div>
