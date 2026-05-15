"use client";

import { useTranslations } from "next-intl";
import { InputMode } from "@/types";

interface Props {
  value: InputMode;
  onChange: (mode: InputMode) => void;
  disabled?: boolean;
}

export function InputModeSelector({ value, onChange, disabled }: Props) {
  const t = useTranslations("chat");

  return (
    <div className="flex gap-2 rounded-xl bg-white/10 p-1 backdrop-blur-sm">
      <button
        onClick={() => onChange("written")}
        disabled={disabled}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
          value === "written"
            ? "bg-indigo-600 text-white shadow-lg"
            : "text-white/70 hover:text-white"
        } disabled:opacity-50`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {t("written")}
      </button>
      <button
        onClick={() => onChange("oral")}
        disabled={disabled}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
          value === "oral"
            ? "bg-indigo-600 text-white shadow-lg"
            : "text-white/70 hover:text-white"
        } disabled:opacity-50`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        {t("oral")}
      </button>
    </div>
  );
}
