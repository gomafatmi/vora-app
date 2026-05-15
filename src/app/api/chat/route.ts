import { NextRequest, NextResponse } from "next/server";
import { classifyEmotion, detectCrisis, generateTherapeuticResponse } from "@/lib/ai/agent";
import { logger } from "@/lib/logging";

export async function GET() {
  return NextResponse.json({ status: "ok", demo: !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.startsWith("sk-ant-placeholder") });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { message, locale } = body;

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
      locale: locale ?? "en",
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
    const body = await req.json().catch(() => ({}));
    const fallbackLocale = body.locale ?? "en";
    const fallbackMessages: Record<string, string> = {
      en: "I'm here to listen. Tell me more about what's on your mind.",
      fr: "Je suis là pour t'écouter. Dis-m'en plus sur ce qui te préoccupe.",
      es: "Estoy aquí para escucharte. Cuéntame más sobre lo que te preocupa.",
      de: "Ich bin hier, um zuzuhören. Erzähl mir mehr darüber, was dich beschäftigt.",
      it: "Sono qui per ascoltarti. Raccontami di più su cosa ti preoccupa.",
      pt: "Estou aqui para ouvir. Conte-me mais sobre o que está a preocupá-lo.",
      ar: "أنا هنا لأستمع. أخبرني المزيد عما يشغل بالك.",
      zh: "我在这里倾听。告诉我更多你在想什么。",
      ja: "私はここで話を聞きます。何が気になっているのか、もっと教えてください。",
      ru: "Я здесь, чтобы выслушать. Расскажите мне больше о том, что вас беспокоит.",
    };
    const demoResponse = fallbackMessages[fallbackLocale] ?? fallbackMessages.en!;
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
