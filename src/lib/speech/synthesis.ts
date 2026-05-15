export type SynthesisStatus =
  | "idle"
  | "speaking"
  | "paused"
  | "error"
  | "done";

export type SynthesisStatusCallback = (status: SynthesisStatus) => void;

const TTS_LANG_MAP: Record<string, string> = {
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

export function getTTSLanguage(locale: string): string {
  return TTS_LANG_MAP[locale] ?? "en-US";
}

export function speak(
  text: string,
  locale: string,
  onStatus?: SynthesisStatusCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) {
      onStatus?.("error");
      reject(new Error("Speech synthesis not supported"));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getTTSLanguage(locale);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => onStatus?.("speaking");
    utterance.onend = () => {
      onStatus?.("done");
      resolve();
    };
    utterance.onerror = (event) => {
      onStatus?.("error");
      reject(new Error(event.error));
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
