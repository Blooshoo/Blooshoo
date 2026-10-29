import { test, expect } from "@playwright/test";

// ── Public pages ──────────────────────────────────────────────────────

test("homepage loads and has security headers", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);

  // Security headers
  const headers = res!.headers();
  expect(headers["content-security-policy"]).toBeDefined();
  expect(headers["strict-transport-security"]).toContain("max-age=63072000");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");

  // Content
  await expect(page.locator("h1")).toContainText("blooshoo");
  await expect(page.getByRole("navigation").getByRole("link", { name: "Bloochat" })).toHaveCount(0);
});

test("blog page loads", async ({ page }) => {
  const res = await page.goto("/blog");
  expect(res?.status()).toBe(200);
});

test("projects / friendship circle loads", async ({ page }) => {
  const res = await page.goto("/projects");
  expect(res?.status()).toBe(200);
});

test("contact page loads", async ({ page }) => {
  const res = await page.goto("/contact");
  expect(res?.status()).toBe(200);
  await expect(page.locator("h1")).toContainText(/contact/i);
  await expect(page.locator('input[name="agentCanary"]')).toBeHidden();
});

test("capes page loads", async ({ page }) => {
  const res = await page.goto("/capes");
  expect(res?.status()).toBe(200);
});

// ── Auth redirects ─────────────────────────────────────────────────────

test("admin routes redirect to login when unauthenticated", async ({
  page,
}) => {
  const adminPages = [
    "/bloo",
    "/bloo/posts",
    "/bloo/projects",
    "/bloo/media",
    "/bloo/users",
    "/bloo/messages",
  ];

  for (const path of adminPages) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/bloo\/login/);
  }
});

test("login page loads with Discord-only sign-in", async ({ page }) => {
  const res = await page.goto("/bloo/login");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("button", { name: /continue with discord/i })).toBeVisible();
});

// ── Contact form ───────────────────────────────────────────────────────

test("contact form shows validation error when empty", async ({ page }) => {
  await page.goto("/contact");
  // Bypass browser native 'required' validation by removing the attributes
  await page.evaluate(() => {
    document
      .querySelectorAll("[required]")
      .forEach((el) => el.removeAttribute("required"));
  });
  await page.locator('form button[type="submit"]').click();
  // Error div: border-red-500/30 bg-red-500/5 text-red-400
  const error = page.locator('.text-red-400, [class*="text-red"]').first();
  await expect(error).toBeVisible({ timeout: 5000 });
});

// ── Security headers on 404 ────────────────────────────────────────────

test("404 page has security headers", async ({ page }) => {
  const res = await page.goto("/definitely-not-a-real-page");
  expect(res?.status()).toBe(404);

  const headers = res!.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
});

// ── Contact challenge ──────────────────────────────────────────────────
// Note: /contact allows 5 submissions per IP per 5 minutes, and each run of
// this file submits twice. Running the suite 3+ times inside that window
// will hit the limiter.

test("contact form rejects the old 0 + 0 = 0 bypass", async ({ page }) => {
  await page.goto("/contact");
  await page.fill("#name", "Bot");
  await page.fill("#email", "bot@example.com");
  await page.fill("#message", "hi");
  // What a bot used to do: invent its own numbers and answer.
  await page.evaluate(() => {
    const form = document.querySelector("form")!;
    form.querySelector('input[name="challenge"]')!.remove();
    for (const [name, value] of [["num1", "0"], ["num2", "0"]]) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.append(input);
    }
  });
  await page.fill("#answer", "0");
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator(".text-red-400").first()).toBeVisible();
  await expect(page.getByText("Message sent!")).toHaveCount(0);
});

// ── Error pages ────────────────────────────────────────────────────────

test("404 page shows the custom copy and runs a single canvas", async ({ page }) => {
  await page.goto("/definitely-not-a-real-page");
  await expect(page.getByText("whatever you're looking for isn't here")).toBeVisible();
  await expect(page.getByText("Not Found", { exact: true })).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(1);
});

async function countAnimationFrames(page: import("@playwright/test").Page) {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const start = (window as unknown as { __rafCount: number }).__rafCount;
        setTimeout(
          () => resolve((window as unknown as { __rafCount: number }).__rafCount - start),
          600,
        );
      }),
  );
}

test.describe("error scene motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __rafCount: number };
      w.__rafCount = 0;
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => {
        w.__rafCount++;
        return raf(cb);
      };
    });
  });

  test("animates normally", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/definitely-not-a-real-page");
    expect(await countAnimationFrames(page)).toBeGreaterThan(5);
  });

  test("stops animating under prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/definitely-not-a-real-page");
    expect(await countAnimationFrames(page)).toBe(0);
  });
});

// ── Scene picker ───────────────────────────────────────────────────────

test("scene picker is a keyboard-operable menu", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Scene picker" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  const box = await trigger.evaluate((el) => {
    const r = getComputedStyle(el, "::before");
    return { w: parseFloat(r.width), h: parseFloat(r.height) };
  });
  expect(box.w).toBeGreaterThanOrEqual(44);
  expect(box.h).toBeGreaterThanOrEqual(44);

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const menu = page.getByRole("menu", { name: "Background scenes" });
  await expect(menu).toBeVisible();

  const items = menu.getByRole("menuitemradio");
  await expect(items.first()).toBeVisible();
  await expect(menu.locator('[aria-checked="true"]')).toHaveCount(1);
  await expect(items.and(page.locator(":focus"))).toHaveCount(1);

  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
