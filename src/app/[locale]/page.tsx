"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { LanguageSelector } from "@/components/chat/LanguageSelector";

export default function LandingPage() {
  const t = useTranslations("landing");
  const router = useRouter();

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: "url(/zen.jpg)" }}
    >
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <span className="inline-block text-6xl">💙</span>
          <h1 className="text-4xl font-bold text-white">{t("title")}</h1>
          <p className="text-lg text-white/60">{t("subtitle")}</p>
        </div>

        <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-sm border border-white/10">
          <p className="text-sm text-white/70 mb-4">{t("selectLanguage")}</p>
          <LanguageSelector />

          <div className="mt-6 space-y-3">
            <button
              onClick={() => router.push("/chat")}
              className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30"
            >
              {t("startButton")}
            </button>
            <p className="text-xs text-white/40">{t("privacy")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left">
          {[
            { icon: "🔒", text: t("private") },
            { icon: "🌍", text: t("multilingual") },
            { icon: "🧠", text: t("expert") },
            { icon: "🎙️", text: t("voiceOption") },
          ].map((item) => (
            <div
              key={item.text}
              className="rounded-xl bg-white/5 p-3 border border-white/5"
            >
              <span className="text-lg">{item.icon}</span>
              <p className="mt-1 text-xs text-white/60">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
