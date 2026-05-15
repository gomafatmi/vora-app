import { describe, it, expect } from "vitest";

describe("i18n messages", () => {
  const locales = ["en", "fr", "es", "de", "it", "pt", "ar", "zh", "ja", "ru"];

  for (const locale of locales) {
    it(`${locale} should have all required keys`, async () => {
      const messages = await import(`../messages/${locale}.json`);
      expect(messages.landing).toBeDefined();
      expect(messages.landing.title).toBeDefined();
      expect(messages.landing.startButton).toBeDefined();
      expect(messages.chat).toBeDefined();
      expect(messages.chat.welcome).toBeDefined();
      expect(messages.chat.inputPlaceholder).toBeDefined();
      expect(messages.crisis).toBeDefined();
      expect(messages.crisis.helpline).toBeDefined();
    });
  }
});
