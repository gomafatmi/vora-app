"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createRecognizer, SpeechStatus } from "@/lib/speech/recognition";

interface Props {
  locale: string;
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ locale, onTranscript, disabled }: Props) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const recognizerRef = useRef<ReturnType<typeof createRecognizer>>(null);

  const handleResult = useCallback(
    (result: { transcript: string; isFinal: boolean }) => {
      if (result.isFinal && result.transcript.trim()) {
        onTranscript(result.transcript.trim());
      }
    },
    [onTranscript]
  );

  const toggleListening = useCallback(() => {
    if (status === "listening") {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      return;
    }

    const recognizer = createRecognizer(locale, handleResult, setStatus);
    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
      setStatus("listening");
    } else {
      setStatus("error");
    }
  }, [locale, status, handleResult]);

  useEffect(() => {
    return () => {
      recognizerRef.current?.abort();
    };
  }, []);

  const isListening = status === "listening";
  const isDisabled = disabled || status === "processing";

  return (
    <button
      onClick={toggleListening}
      disabled={isDisabled}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
        isListening
          ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
          : status === "error"
          ? "bg-yellow-500 text-white"
          : "bg-white/10 text-white hover:bg-white/20"
      } disabled:opacity-50`}
      title={isListening ? "Stop recording" : "Start voice input"}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {isListening ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        )}
      </svg>
      {isListening ? "Listening..." : status === "error" ? "Mic error" : "Voice"}
    </button>
  );
}
