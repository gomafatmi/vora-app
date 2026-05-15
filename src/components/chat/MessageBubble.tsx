"use client";

import { ProblemDomain } from "@/types";

interface Props {
  message: string;
  role: "user" | "assistant" | "system";
  problemDomain?: ProblemDomain;
  timestamp?: number;
}

const domainGradients: Record<string, string> = {
  stress: "from-orange-500/20 to-red-500/10",
  anxiety: "from-purple-500/20 to-indigo-500/10",
  inferiority: "from-blue-500/20 to-cyan-500/10",
  anger: "from-red-600/20 to-orange-600/10",
  depression: "from-slate-600/20 to-blue-900/10",
  grief: "from-gray-600/20 to-indigo-900/10",
  deception: "from-amber-600/20 to-yellow-600/10",
  loneliness: "from-teal-600/20 to-blue-800/10",
  burnout: "from-stone-600/20 to-amber-800/10",
  trauma: "from-rose-700/20 to-red-800/10",
};

export function MessageBubble({ message, role, problemDomain }: Props) {
  const isUser = role === "user";
  const isSystem = role === "system";

  const gradient =
    problemDomain && domainGradients[problemDomain]
      ? domainGradients[problemDomain]
      : "from-white/5 to-white/10";

  if (isSystem) {
    return (
      <div className="flex justify-center px-4 py-2">
        <span className="rounded-full bg-white/5 px-4 py-1 text-xs text-white/50">
          {message}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} px-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : `bg-gradient-to-br ${gradient} text-white/90 rounded-bl-sm backdrop-blur-sm`
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message}</p>
        {problemDomain && !isUser && (
          <span className="mt-1.5 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/50">
            {problemDomain}
          </span>
        )}
      </div>
    </div>
  );
}
