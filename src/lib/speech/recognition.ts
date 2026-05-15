export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  language: string;
}

export type SpeechStatus =
  | "idle"
  | "listening"
  | "processing"
  | "error"
  | "done";

export type SpeechCallback = (result: SpeechRecognitionResult) => void;
export type StatusCallback = (status: SpeechStatus) => void;

interface SpeechRecognitionAPI extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: {
    results: SpeechRecognitionResultList;
  }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionAPI;
    webkitSpeechRecognition?: new () => SpeechRecognitionAPI;
  }
}

const STT_LANG_MAP: Record<string, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-BR",
  ar: "ar-SA",
  zh: "zh-CN",
  ja: "ja-JP",
  ru: "ru-RU",
};

export function getSTTLanguage(locale: string): string {
  return STT_LANG_MAP[locale] ?? "en-US";
}

export function createRecognizer(
  locale: string,
  onResult: SpeechCallback,
  onStatus: StatusCallback
) {
  const SpeechRecognitionAPI =
    window.SpeechRecognition ?? window.webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    onStatus("error");
    return null;
  }

  const recognizer = new SpeechRecognitionAPI();
  recognizer.continuous = true;
  recognizer.interimResults = true;
  recognizer.lang = getSTTLanguage(locale);

  recognizer.onresult = (event) => {
    const last = event.results.item(event.results.length - 1);
    if (!last) return;
    const transcript = last.item(0)?.transcript ?? "";
    onResult({
      transcript,
      isFinal: last.isFinal,
      language: recognizer.lang,
    });
    if (last.isFinal) {
      onStatus("done");
    }
  };

  recognizer.onerror = (event) => {
    onStatus("error");
  };

  recognizer.onend = () => {
    onStatus("idle");
  };

  return recognizer;
}

export function startListening(recognizer: SpeechRecognitionAPI) {
  try {
    recognizer.start();
  } catch {
    // already started, ignore
  }
}

export function stopListening(recognizer: SpeechRecognitionAPI) {
  recognizer.stop();
}
