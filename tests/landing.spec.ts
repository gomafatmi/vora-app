import { test, expect } from "@playwright/test";

test.describe("Psych Assist - Landing Page", () => {
  test("should render landing page with title", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("text=Psych Assist")).toBeVisible();
    await expect(page.locator("text=Start Talking")).toBeVisible();
  });

  test("should have language selector with 10 options", async ({ page }) => {
    await page.goto("/en");
    const selector = page.locator("select");
    await expect(selector).toBeVisible();
    const options = await selector.locator("option").all();
    expect(options.length).toBe(10);
  });

  test("should navigate to chat page", async ({ page }) => {
    await page.goto("/en");
    await page.locator("text=Start Talking").click();
    await expect(page).toHaveURL(/\/en\/chat/);
  });

  test("should display language-specific content in French", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.locator("text=Commencer à parler")).toBeVisible();
  });

  test("should display language-specific content in Arabic (RTL)", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("text=ابدأ التحدث")).toBeVisible();
  });
});

test.describe("Psych Assist - Chat Page", () => {
  test("should render chat interface", async ({ page }) => {
    await page.goto("/en/chat");
    await expect(page.locator("text=Write")).toBeVisible();
    await expect(page.locator("text=Speak")).toBeVisible();
  });

  test("should toggle between written and oral modes", async ({ page }) => {
    await page.goto("/en/chat");
    const writeBtn = page.locator("text=Write");
    const speakBtn = page.locator("text=Speak");

    await writeBtn.click();
    await expect(page.locator('textarea[placeholder="Type your thoughts here..."]')).toBeVisible();

    await speakBtn.click();
    await expect(page.locator("text=Tap to speak")).toBeVisible();
  });

  test("should send a message and show it in the chat", async ({ page }) => {
    await page.goto("/en/chat");
    await page.locator("text=Write").click();

    const textarea = page.locator('textarea[placeholder="Type your thoughts here..."]');
    await textarea.fill("I've been feeling stressed lately");
    await page.locator("text=Send").click();

    await expect(page.locator("text=I've been feeling stressed lately")).toBeVisible();
  });

  test("should display welcome message", async ({ page }) => {
    await page.goto("/en/chat");
    await expect(page.locator("text=What's on your mind?")).toBeVisible();
  });

  test("should render language selector on chat page", async ({ page }) => {
    await page.goto("/en/chat");
    const selector = page.locator("select");
    await expect(selector).toBeVisible();
  });
});
