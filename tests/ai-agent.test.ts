import { describe, it, expect } from "vitest";
import {
  classifyEmotion,
  detectCrisis,
  generateTherapeuticResponse,
  getCrisisHotline,
} from "@/lib/ai/agent";

describe("AI Agent - Demo Mode", () => {
  it("classifyEmotion should detect anxiety", async () => {
    const result = await classifyEmotion("I feel really anxious about my job interview tomorrow");
    expect(result.problemDomain).toBe("anxiety");
    expect(result.primaryEmotion).toBe("fear");
    expect(["none", "low", "medium"]).toContain(result.crisisLevel);
  });

  it("classifyEmotion should detect stress", async () => {
    const result = await classifyEmotion("I'm so stressed with work, I can't sleep");
    expect(result.problemDomain).toBe("stress");
  });

  it("classifyEmotion should detect depression", async () => {
    const result = await classifyEmotion("I feel empty and hopeless, nothing matters anymore");
    expect(result.problemDomain).toBe("depression");
  });

  it("classifyEmotion should detect anger", async () => {
    const result = await classifyEmotion("I'm so angry at everyone, I can't control my rage");
    expect(result.problemDomain).toBe("anger");
  });

  it("classifyEmotion should detect grief", async () => {
    const result = await classifyEmotion("I lost my mother last month and I can't stop crying");
    expect(result.problemDomain).toBe("grief");
  });

  it("classifyEmotion should detect inferiority", async () => {
    const result = await classifyEmotion("I feel worthless, like I'm not good enough for anyone");
    expect(result.problemDomain).toBe("inferiority");
  });

  it("classifyEmotion should detect loneliness", async () => {
    const result = await classifyEmotion("I feel so alone, no one understands me");
    expect(result.problemDomain).toBe("loneliness");
  });

  it("classifyEmotion should detect trauma", async () => {
    const result = await classifyEmotion("I keep having flashbacks from the accident");
    expect(result.problemDomain).toBe("trauma");
  });

  it("detectCrisis should flag suicidal ideation", async () => {
    const result = await detectCrisis("I want to end my life, I can't take it anymore");
    expect(result.crisisDetected).toBe(true);
    expect(["high", "critical"]).toContain(result.level);
  });

  it("detectCrisis should flag critical with plan", async () => {
    const result = await detectCrisis("I have a plan to kill myself tonight with pills");
    expect(result.crisisDetected).toBe(true);
    expect(result.level).toBe("critical");
  });

  it("detectCrisis should not flag normal distress", async () => {
    const result = await detectCrisis("I'm feeling a bit stressed about work deadlines");
    expect(result.crisisDetected).toBe(false);
  });

  it("generateTherapeuticResponse should return relevant response for anxiety", async () => {
    const response = await generateTherapeuticResponse({
      input: "I'm scared about my presentation tomorrow",
      problemDomain: "anxiety",
      primaryEmotion: "fear",
      crisisLevel: "none",
    });
    expect(response).toBeTruthy();
    expect(response.length).toBeGreaterThan(50);
    expect(
      response.includes("grounding") || response.includes("cognitive restructuring")
    ).toBe(true);
  });

  it("generateTherapeuticResponse should return crisis response for critical level", async () => {
    const response = await generateTherapeuticResponse({
      input: "I want to die",
      problemDomain: "depression",
      primaryEmotion: "hopelessness",
      crisisLevel: "high",
    });
    expect(response).toContain("988");
  });

  it("generateTherapeuticResponse should return grief support", async () => {
    const response = await generateTherapeuticResponse({
      input: "My dog died and I can't stop crying",
      problemDomain: "grief",
      primaryEmotion: "grief",
      crisisLevel: "none",
    });
    expect(response).toBeTruthy();
    expect(response.length).toBeGreaterThan(50);
  });

  it("generateTherapeuticResponse should handle unknown domain", async () => {
    const response = await generateTherapeuticResponse({
      input: "I don't know why I'm here but something feels off",
      problemDomain: "unknown",
      primaryEmotion: "confusion",
      crisisLevel: "none",
    });
    expect(response).toBeTruthy();
    expect(response.length).toBeGreaterThan(50);
  });
});
