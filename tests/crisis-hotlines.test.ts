import { describe, it, expect } from "vitest";
import { getCrisisHotline } from "@/lib/crisis";

describe("getCrisisHotline", () => {
  it("should return US hotline for en locale", () => {
    const result = getCrisisHotline("en");
    expect(result).toBe("988 (Suicide & Crisis Lifeline)");
  });

  it("should return French hotline for fr locale", () => {
    const result = getCrisisHotline("fr");
    expect(result).toBe("3114 (Suicide Écoute)");
  });

  it("should return Spanish hotline for es locale", () => {
    const result = getCrisisHotline("es");
    expect(result).toBe("024 (Línea de Conducta Suicida)");
  });

  it("should return German hotline for de locale", () => {
    const result = getCrisisHotline("de");
    expect(result).toBe("0800-111-0-111 (Telefonseelsorge)");
  });

  it("should return Italian hotline for it locale", () => {
    const result = getCrisisHotline("it");
    expect(result).toBe("199-284-284 (Telefono Amico)");
  });

  it("should return Portuguese hotline for pt locale", () => {
    const result = getCrisisHotline("pt");
    expect(result).toBe("800 202 669 (SOS Voz Amiga)");
  });

  it("should return Arabic hotline for ar locale", () => {
    const result = getCrisisHotline("ar");
    expect(result).toBe("920003334 (خط مساندة)");
  });

  it("should return Chinese hotline for zh locale", () => {
    const result = getCrisisHotline("zh");
    expect(result).toBe("010-8295-1332");
  });

  it("should return Japanese hotline for ja locale", () => {
    const result = getCrisisHotline("ja");
    expect(result).toBe("0120-279-338 (いのちの電話)");
  });

  it("should return Russian hotline for ru locale", () => {
    const result = getCrisisHotline("ru");
    expect(result).toBe("8-800-333-44-34 (Телефон доверия)");
  });

  it("should fallback to US hotline for unknown locale", () => {
    const result = getCrisisHotline("ko");
    expect(result).toBe("988 (Suicide & Crisis Lifeline)");
  });
});
