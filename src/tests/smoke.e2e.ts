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
