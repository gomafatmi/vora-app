"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { InputModeSelector } from "./InputModeSelector";
import { VoiceRecorder } from "./VoiceRecorder";
import { MessageBubble } from "./MessageBubble";
import { BackgroundScene } from "./BackgroundScene";
import { CrisisAlert } from "./CrisisAlert";
import { LanguageSelector } from "./LanguageSelector";
import { InputMode, ChatMessage, ProblemDomain } from "@/types";

export function ChatContainer() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const [mode, setMode] = useState<InputMode>("written");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "system-welcome",
      role: "system",
      content: t("welcome"),
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<ProblemDomain>();
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState("none");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (mode === "written" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [mode]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), locale, history: messages.slice(-10) }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (data.crisisDetected) {
          setCrisisLevel(data.crisisLevel ?? "medium");
          setCrisisOpen(true);
        }

        if (data.problemDomain) {
          setCurrentProblem(data.problemDomain);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.response,
            timestamp: Date.now(),
            problemDomain: data.problemDomain,
            crisisLevel: data.crisisLevel,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "system",
            content: t("error"),
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, locale, messages, t]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleVoiceTranscript = useCallback(
    (text: string) => {
      handleSend(text);
    },
    [handleSend]
  );

  return (
    <>
      <BackgroundScene problemDomain={currentProblem} />
      <CrisisAlert
        isOpen={crisisOpen}
        level={crisisLevel}
        locale={locale}
        onClose={() => setCrisisOpen(false)}
      />

      <div className="relative z-10 flex h-screen flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-xl">💙</span>
            <h1 className="text-lg font-semibold text-white">VORA</h1>
          </div>
          <div className="flex items-center gap-3">
            <InputModeSelector value={mode} onChange={setMode} disabled={isLoading} />
            <LanguageSelector disabled={isLoading} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg.content}
              role={msg.role}
              problemDomain={msg.problemDomain}
              timestamp={msg.timestamp}
            />
          ))}
          {isLoading && (
            <div className="flex justify-start px-4">
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        <footer className="border-t border-white/10 bg-black/20 px-4 py-3 backdrop-blur-md">
          {mode === "written" ? (
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("inputPlaceholder")}
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none rounded-xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={isLoading || !input.trim()}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
                {t("send")}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <VoiceRecorder
                locale={locale}
                onTranscript={handleVoiceTranscript}
                disabled={isLoading}
              />
              <p className="ml-3 text-xs text-white/40">{t("voiceHint")}</p>
            </div>
          )}
        </footer>
      </div>
    </>
  );
}
