import { NextRequest, NextResponse } from "next/server";
import { classifyEmotion, detectCrisis, generateTherapeuticResponse } from "@/lib/ai/agent";
import { logger } from "@/lib/logging";

export async function GET() {
  return NextResponse.json({ status: "ok", demo: !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith("sk-ant-placeholder") });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const [classification, crisis] = await Promise.all([
      classifyEmotion(message),
      detectCrisis(message),
    ]);

    const response = await generateTherapeuticResponse({
      input: message,
      problemDomain: classification.problemDomain,
      primaryEmotion: classification.primaryEmotion,
      crisisLevel: crisis.level,
    });

    return NextResponse.json({
      response,
      problemDomain: classification.problemDomain,
      primaryEmotion: classification.primaryEmotion,
      crisisDetected: crisis.crisisDetected,
      crisisLevel: crisis.level,
      crisisReason: crisis.reason,
      crisisAction: crisis.suggestedAction,
    });
  } catch (error) {
    const msg = String(error);
    logger.error({ operation: "chat", error: msg }, "chat API failed");
    const demoResponse = "I'm here to listen. Tell me more about what's on your mind.";
    return NextResponse.json(
      {
        response: demoResponse,
        problemDomain: "unknown",
        crisisDetected: false,
        crisisLevel: "none",
      },
      { status: 200 }
    );
  }
}
