---
description: "Use when writing or editing Tailwind CSS classes, styling Svelte components, adding design tokens, or modifying layout.css. Enforces Tailwind v4 syntax, project design tokens, and component utility conventions."
applyTo: "**/*.svelte", "src/routes/layout.css"
---

# Tailwind CSS Rules

## Version & Setup

This project uses **Tailwind CSS v4** with a CSS-first configuration — there is no `tailwind.config.js`.

```css
/* src/routes/layout.css */
@import 'tailwindcss';
@plugin '@tailwindcss/forms';
@plugin '@tailwindcss/typography';
```

All theme tokens, component utilities, and plugin registrations live in `src/routes/layout.css`.

## Design Tokens: Always Use Named Tokens

Inline arbitrary values are **forbidden** for anything already defined in `@theme`. Prefer named tokens.

| Category             | Token prefix                                     | Examples                                                  |
| -------------------- | ------------------------------------------------ | --------------------------------------------------------- |
| Glow box-shadows     | `shadow-glow-*`                                  | `shadow-glow-cyan-sm`, `shadow-glow-fuchsia-md`           |
| Card/panel shadows   | `shadow-card`, `shadow-topbar`, `shadow-sidebar` | `shadow-card-hover`, `shadow-login-card`                  |
| Drop-shadow glows    | `drop-shadow-glow-*`                             | `drop-shadow-glow-cyan-md`, `drop-shadow-glow-fuchsia-lg` |
| Blur orbs            | `blur-orb-*`                                     | `blur-orb-sm`, `blur-orb-md`, `blur-orb-lg`               |
| Micro font sizes     | `text-label-xs`, `text-label`, `text-ui`         | use on labels, badges, buttons                            |
| Discord brand colors | `bg-discord`, `text-discord-*`                   | `text-discord-muted`, `bg-discord-surface`                |

When a value isn't covered by an existing token, **add it to `@theme` in `layout.css`** first, then reference it by name. Never use `shadow-[...]`, `text-[11px]`, or similar inline arbitrary overrides for project-defined values.

## Color Palette

The app is **dark-only** — never add `dark:` variant classes or design for a light mode.

| Role               | Tailwind classes                                                 |
| ------------------ | ---------------------------------------------------------------- |
| Page background    | `bg-slate-950`                                                   |
| Surface / card     | `bg-slate-900/40`, `bg-slate-800/80`, `bg-slate-950/50`          |
| Border             | `border-slate-800/60`, `border-slate-800/80`, `border-slate-700` |
| Text primary       | `text-slate-200`, `text-slate-100`                               |
| Text muted         | `text-slate-400`, `text-slate-500`                               |
| Accent — primary   | `text-cyan-400`, `border-cyan-500/50`, `bg-cyan-500/10`          |
| Accent — secondary | `text-fuchsia-400`, `border-fuchsia-500/50`, `bg-fuchsia-500/10` |
| Accent — tertiary  | `purple-*`, `emerald-*`, `rose-*`                                |

Use opacity modifiers (`/10`, `/20`, `/30`, `/50`) for translucent backgrounds and borders. Reserve full-opacity fills for active/focus states only. Do not introduce new brand colors outside the established palette.

## Component Utilities

Before writing repetitive `@apply` chains inline, check for existing component classes in `layout.css`:

| Class         | Use for                                           |
| ------------- | ------------------------------------------------- |
| `.input-dark` | `<input>`, `<select>`, `<textarea>` form controls |
| `.label-caps` | Uppercase micro-label headings                    |
| `.btn-cyan`   | Primary cyan action button                        |
| `.btn-ghost`  | Secondary / ghost button                          |

When a pattern repeats 3+ times across components, extract it into `@layer components` in `layout.css` using `@apply`.

## Interaction Patterns

Use consistent transitions and hover patterns:

```html
<!-- Card with border + glow on hover -->
<div
	class="border border-slate-800/60 transition-all duration-300 hover:border-cyan-500/50 hover:shadow-glow-cyan-md"
>
	<!-- Group: icon glows when parent is hovered -->
	<div class="group">
		<svg
			class="text-slate-400 transition-colors duration-300 group-hover:text-cyan-400 group-hover:drop-shadow-glow-cyan-md"
		/>
	</div>
</div>
```

- Always pair state changes with `transition-all duration-300`
- Use `group` + `group-hover:` for parent-triggered child transitions
- Use `hover:-translate-y-1` for card lift effects
- Use `overflow-hidden` on containers with absolutely-positioned glow overlays

## Responsive Layout

Use Tailwind breakpoint prefixes for responsive grids. No mobile-first assumptions required — the admin panel targets desktop, but responsive grids are standard:

```html
<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"></div>
```

Standard breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).

## Avoid

- Arbitrary values (`shadow-[...]`, `text-[11px]`) for anything already in `@theme`
- `style=""` attributes for values achievable with utility classes
- `dark:` variant classes — the app is dark-only
- Adding colors outside `slate` / `cyan` / `fuchsia` / `purple` / `emerald` / `rose`
- New `@theme` tokens that duplicate existing ones at similar opacity levels
