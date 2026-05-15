"use client";

import { useEffect, useState } from "react";
import { getCrisisHotline } from "@/lib/crisis";

interface Props {
  isOpen: boolean;
  level: string;
  locale: string;
  onClose: () => void;
}

export function CrisisAlert({ isOpen, level, locale, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible) return null;

  const hotline = getCrisisHotline(locale);
  const isCritical = level === "high" || level === "critical";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={`relative max-w-md w-full rounded-2xl p-6 shadow-2xl ${
          isCritical
            ? "bg-red-900/90 border border-red-500/50"
            : "bg-amber-900/90 border border-amber-500/50"
        } backdrop-blur-xl`}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{isCritical ? "🆘" : "⚠️"}</span>
          <div>
            <h3 className="text-lg font-bold text-white">
              {isCritical ? "Urgent Support Available" : "Someone is here for you"}
            </h3>
            <p className="text-sm text-white/70">
              You don&apos;t have to go through this alone
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white/10 p-4 mb-4">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
            Crisis Helpline
          </p>
          <p className="text-xl font-bold text-white">{hotline}</p>
        </div>

        <p className="text-sm text-white/80 mb-4">
          Trained crisis counselors are available 24/7 to listen and support you.
          Please reach out — you matter.
        </p>

        <div className="flex gap-2">
          <a
            href={`tel:${hotline.replace(/\D/g, "")}`}
            className="flex-1 rounded-xl bg-white/20 px-4 py-3 text-center text-sm font-medium text-white hover:bg-white/30 transition"
          >
            Call Now
          </a>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/20 transition"
          >
            I&apos;m safe
          </button>
        </div>
      </div>
    </div>
  );
}
