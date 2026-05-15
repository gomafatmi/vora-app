import { z } from "zod";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { logger } from "../logging";
import { getCrisisHotline } from "../crisis";

export type ProblemDomain =
  | "stress" | "anxiety" | "inferiority" | "anger"
  | "depression" | "grief" | "deception" | "loneliness"
  | "burnout" | "trauma" | "unknown";

const DEMO_MODE = !process.env.GROQ_API_KEY;

let _model: ChatGroq | null = null;

function getModel(): ChatGroq | null {
  if (DEMO_MODE) return null;
  if (!_model) {
    _model = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      maxTokens: 4096,
    });
  }
  return _model;
}

const classificationSchema = z.object({
  primaryEmotion: z.string(),
  intensity: z.number().min(0).max(1),
  problemDomain: z.enum([
    "stress", "anxiety", "inferiority", "anger",
    "depression", "grief", "deception", "loneliness",
    "burnout", "trauma", "unknown",
  ]),
  crisisLevel: z.enum(["none", "low", "medium", "high", "critical"]),
  confidence: z.number().min(0).max(1),
});

const classifierPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert clinical psychologist specializing in psychodiagnosis. Analyze the user's message and classify their emotional state.

Rules:
- primaryEmotion: the single dominant emotion (e.g., "fear", "sadness", "anger", "shame", "hopelessness")
- intensity: 0-1 scale based on language intensity
- problemDomain: choose the closest match from the provided list
- crisisLevel: "critical" = active suicidal/homicidal ideation with plan, "high" = suicidal ideation without plan, "medium" = self-harm thoughts, "low" = distress without danger, "none" = safe
- confidence: how sure you are (0-1)

Respond ONLY in valid JSON format, no markdown.`,
  ],
  ["human", "{input}"],
]);

function demoClassify(input: string) {
  const inputLower = input.toLowerCase();
  let domain: ProblemDomain = "unknown";
  let emotion = "distress";
  let level: "none" | "low" | "medium" | "high" | "critical" = "none";

  if (inputLower.includes("suicid") || inputLower.includes("kill myself") || inputLower.includes("end my life") || inputLower.includes("want to die")) {
    domain = "depression"; emotion = "hopelessness"; level = "high";
  } else if (inputLower.includes("anxi") || inputLower.includes("panic") || inputLower.includes("worried") || inputLower.includes("fear")) {
    domain = "anxiety"; emotion = "fear";
  } else if (inputLower.includes("stress") || inputLower.includes("overwhelm") || inputLower.includes("burnout")) {
    domain = "stress"; emotion = "overwhelm";
  } else if (inputLower.includes("anger") || inputLower.includes("frustrat") || inputLower.includes("rage") || inputLower.includes("mad")) {
    domain = "anger"; emotion = "anger";
  } else if (inputLower.includes("sad") || inputLower.includes("depress") || inputLower.includes("empty") || inputLower.includes("hopeless")) {
    domain = "depression"; emotion = "sadness";
  } else if (inputLower.includes("grief") || inputLower.includes("loss") || inputLower.includes("lost") || inputLower.includes("mourn") || inputLower.includes("died") || inputLower.includes("death")) {
    domain = "grief"; emotion = "grief";
  } else if (inputLower.includes("inferior") || inputLower.includes("worthless") || inputLower.includes("not good enough") || inputLower.includes("impostor")) {
    domain = "inferiority"; emotion = "shame";
  } else if (inputLower.includes("lonely") || inputLower.includes("alone") || inputLower.includes("isolated")) {
    domain = "loneliness"; emotion = "loneliness";
  } else if (inputLower.includes("betray") || inputLower.includes("cheat") || inputLower.includes("lied") || inputLower.includes("deceiv")) {
    domain = "deception"; emotion = "betrayal";
  } else if (inputLower.includes("trauma") || inputLower.includes("abuse") || inputLower.includes("assault") || inputLower.includes("flashback")) {
    domain = "trauma"; emotion = "fear";
  }

  return {
    primaryEmotion: emotion,
    intensity: 0.7,
    problemDomain: domain,
    crisisLevel: level,
    confidence: 0.8,
  };
}

function demoDetectCrisis(input: string) {
  const inputLower = input.toLowerCase();
  const crisisKeywords = ["suicid", "kill myself", "end my life", "want to die", "better off dead", "self-harm", "hurt myself", "no reason to live", "can't go on"];
  const detected = crisisKeywords.some(k => inputLower.includes(k));

  if (!detected) {
    return { crisisDetected: false, level: "none" as const, reason: "", suggestedAction: "" };
  }

  if (inputLower.includes("plan") || inputLower.includes("tonight") || inputLower.includes("today") || inputLower.includes("pills") || inputLower.includes("gun")) {
    return { crisisDetected: true, level: "critical" as const, reason: "Active suicidal ideation with plan or means", suggestedAction: "Immediate crisis intervention required" };
  }

  return { crisisDetected: true, level: "high" as const, reason: "Passive suicidal ideation detected", suggestedAction: "Assess safety and provide crisis resources" };
}

const demoResponses: Record<string, string[]> = {
  anxiety: [
    "I hear how overwhelming this anxiety feels for you right now. Let me share a technique that might help: the **5-4-3-2-1 grounding exercise**. Look around and name 5 things you can see, 4 things you can feel, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This brings your mind back to the present moment. Would you like to try it together?",
    "Anxiety often comes from our mind projecting into the future, imagining worst-case scenarios. One CBT technique that helps many people is **cognitive restructuring** — gently questioning those thoughts: 'What evidence do I have that this will happen? What's a more balanced way to look at this?' What specific thoughts are racing through your mind right now?",
  ],
  stress: [
    "It sounds like you're carrying a heavy load. Let's take a moment to breathe together. **Box breathing**: inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Just three rounds. You don't have to solve everything today. What's the one thing weighing on you most right now?",
    "Stress often builds when we feel like we've lost control. Let's identify what's within your control and what isn't. This **locus of control** exercise from CBT can help reduce that overwhelm. Tell me more about what's happening — sometimes naming it is the first step to taming it.",
  ],
  depression: [
    "I'm glad you shared this. Depression can make everything feel heavy and hopeless, but please know that these feelings, as real and painful as they are, don't define you. **Behavioral activation** — starting with one tiny action, like making tea or stepping outside for 30 seconds — can slowly help. What's one very small thing you might be able to do today?",
    "That feeling of emptiness you described — it's more common than you might think, and you're not broken for feeling it. In **ACT (Acceptance and Commitment Therapy)**, we learn to make room for difficult feelings without letting them control us. What would matter to you, if the depression wasn't in the way?",
  ],
  anger: [
    "Anger often protects deeper feelings like hurt, fear, or powerlessness. I want to understand what's underneath yours. **The STOP technique** — Stop, Take a breath, Observe your feelings, Proceed — can help in moments of intensity. What happened right before the anger showed up?",
  ],
  grief: [
    "Grief is not something to 'get over' — it's something we learn to carry. The waves may come at any time, and that's okay. Have you been allowing yourself to feel the sadness, or do you find yourself trying to stay busy to avoid it? Sometimes just saying their name out loud can be a small relief.",
  ],
  inferiority: [
    "That voice that tells you you're not good enough — let's look at it together. Where did that message come from? **Cognitive reframing** can help: would you judge a friend as harshly as you judge yourself? What might a compassionate friend say to you right now?",
  ],
  loneliness: [
    "Loneliness is a signal, not a flaw — it means you're longing for connection, which is deeply human. Reaching out, even in small ways, can feel impossible when you're in it. What would 'small connection' look like for you today?",
  ],
  deception: [
    "Betrayal cuts deep because it challenges our trust in others and ourselves. It's natural to question everything after being deceived. What do you need most right now — understanding what happened, or space to feel your feelings about it?",
  ],
  burnout: [
    "Burnout isn't just tiredness — it's exhaustion of the mind, body, and spirit from giving too much for too long. Recovery starts with rest, not with a vacation, but with setting boundaries. What would it feel like to give yourself permission to rest without guilt?",
  ],
  trauma: [
    "Trauma lives in the body, not just the mind. Please be gentle with yourself. If talking about it feels too overwhelming, we don't need to go there right now. **Grounding** can help: feel your feet on the floor, your back against the chair. You are here, in the present, and you are safe right now. Would you like to try a brief grounding exercise?",
  ],
  unknown: [
    "Thank you for being here and for starting this conversation. Sometimes the hardest part is just beginning. I'm here to listen without judgment. Can you tell me a little more about what brought you here today?",
  ],
};

function demoResponse(input: string, domain: ProblemDomain, crisisLevel: string): string {
  if (crisisLevel === "high" || crisisLevel === "critical") {
    const hotline = getCrisisHotline("en");
    return `I'm really concerned about what you're sharing. Your safety is the most important thing right now. Please reach out to **${hotline}** — trained crisis counselors are available 24/7. They can support you through this moment. Would you like to take a deep breath together while you consider reaching out?`;
  }

  const responses = demoResponses[domain] ?? demoResponses.unknown!;
  return responses[Math.floor(Math.random() * responses.length)]!;
}

export async function classifyEmotion(input: string) {
  const model = getModel();
  if (!model) {
    return demoClassify(input);
  }

  try {
    const chain = classifierPrompt.pipe(model).pipe(new StringOutputParser());
    const raw = await chain.invoke({ input });
    const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return classificationSchema.parse(parsed);
  } catch (error) {
    const msg = String(error);
    if (msg.includes("credit balance") || msg.includes("insufficient_quota")) {
      logger.warn("API credits exhausted, falling back to demo mode");
    } else {
      logger.error({ error: msg }, "classifyEmotion failed");
    }
    return demoClassify(input);
  }
}

export async function detectCrisis(input: string) {
  const model = getModel();
  if (!model) {
    return demoDetectCrisis(input);
  }

  const crisisDetectorPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a crisis assessment specialist. Analyze if the user message contains indicators of immediate danger.
Assess for: suicidal ideation, self-harm, homicidal thoughts, severe hopelessness.
Respond ONLY with JSON: { "crisisDetected": boolean, "level": "none"|"low"|"medium"|"high"|"critical", "reason": "one-line reason", "suggestedAction": "immediate next step" }`,
    ],
    ["human", "{input}"],
  ]);

  try {
    const chain = crisisDetectorPrompt.pipe(model).pipe(new StringOutputParser());
    const raw = await chain.invoke({ input });
    const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/\s*```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return demoDetectCrisis(input);
  }
}

export async function generateTherapeuticResponse(params: {
  input: string;
  problemDomain: string;
  primaryEmotion: string;
  crisisLevel: string;
}) {
  const model = getModel();
  if (!model) {
    return demoResponse(params.input, params.problemDomain as ProblemDomain, params.crisisLevel);
  }

  const therapeuticPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are Dr. Sarah Chen, a warm, compassionate clinical psychologist with 20 years of expertise in CBT, DBT, ACT, mindfulness, and humanistic therapy.

Your communication style:
- Validate deeply before offering any technique
- Name and normalize their emotion
- Offer 1-2 evidence-based techniques (name them)
- Use Socratic questioning to guide insight
- End with a gentle, open invitation to continue sharing

Current context:
- Problem domain: {problemDomain}
- Primary emotion: {primaryEmotion}
- Crisis level: {crisisLevel}

{urgencyInstructions}

IMPORTANT: Respond in the SAME LANGUAGE as the user's message. Be warm, professional, conversational.`,
    ],
    ["human", "{input}"],
  ]);

  function getUrgencyInstructions(level: string): string {
    const map: Record<string, string> = {
      critical: "CRISIS PROTOCOL: Prioritize safety. Provide crisis hotline. Use grounding. Stay with them.",
      high: "URGENT: Gently assess suicidal thoughts. Provide crisis resources. Create immediate safety plan.",
      medium: "CAUTION: Validate distress. Explore coping resources. Check support system.",
      default: "Standard therapeutic approach. Build trust. Validate. Explore coping. Use evidence-based techniques.",
    };
    return map[level] ?? map.default!;
  }

  try {
    const chain = therapeuticPrompt.pipe(model).pipe(new StringOutputParser());
    return await chain.invoke({
      input: params.input,
      problemDomain: params.problemDomain,
      primaryEmotion: params.primaryEmotion,
      crisisLevel: params.crisisLevel,
      urgencyInstructions: getUrgencyInstructions(params.crisisLevel),
    });
  } catch (error) {
    const msg = String(error);
    if (msg.includes("credit balance") || msg.includes("insufficient_quota")) {
      logger.warn("API credits exhausted, falling back to demo mode for response");
    } else {
      logger.error({ error: msg }, "generateTherapeuticResponse failed");
    }
    return demoResponse(params.input, params.problemDomain as ProblemDomain, params.crisisLevel);
  }
}

export { getCrisisHotline };
