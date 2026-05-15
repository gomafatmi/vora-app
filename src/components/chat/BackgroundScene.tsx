"use client";

import { useMemo, useState, useEffect } from "react";
import { ProblemDomain } from "@/types";

interface Particle {
  id: number;
  left: string;
  delay: string;
  duration: string;
  size: number;
}

interface Props {
  problemDomain?: ProblemDomain;
}

const scenes: Record<
  string,
  {
    gradient: string;
    particles: number;
    emoji: string;
  }
> = {
  stress: {
    gradient: "from-orange-900/40 via-red-900/30 to-slate-900",
    particles: 12,
    emoji: "🌊",
  },
  anxiety: {
    gradient: "from-purple-900/40 via-indigo-900/30 to-slate-900",
    particles: 20,
    emoji: "🍃",
  },
  inferiority: {
    gradient: "from-blue-900/40 via-cyan-900/30 to-slate-900",
    particles: 8,
    emoji: "🌱",
  },
  anger: {
    gradient: "from-red-900/50 via-orange-900/30 to-slate-900",
    particles: 15,
    emoji: "💧",
  },
  depression: {
    gradient: "from-slate-800/60 via-blue-950/40 to-slate-900",
    particles: 6,
    emoji: "🌙",
  },
  grief: {
    gradient: "from-gray-900/60 via-indigo-950/40 to-slate-900",
    particles: 5,
    emoji: "🕯️",
  },
  deception: {
    gradient: "from-amber-900/40 via-yellow-900/30 to-slate-900",
    particles: 10,
    emoji: "🌟",
  },
  loneliness: {
    gradient: "from-teal-900/40 via-blue-900/30 to-slate-900",
    particles: 4,
    emoji: "✨",
  },
  burnout: {
    gradient: "from-stone-800/50 via-amber-900/30 to-slate-900",
    particles: 8,
    emoji: "🔥",
  },
  trauma: {
    gradient: "from-rose-900/50 via-red-950/40 to-slate-900",
    particles: 14,
    emoji: "🕊️",
  },
  unknown: {
    gradient: "from-indigo-900/30 via-slate-800/20 to-slate-900",
    particles: 10,
    emoji: "💫",
  },
};

export function BackgroundScene({ problemDomain }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  const scene = useMemo(
    () => scenes[problemDomain ?? "unknown"] ?? scenes.unknown!,
    [problemDomain],
  );

  useEffect(() => {
    setMounted(true);
    setParticles(
      Array.from({ length: scene.particles }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        duration: `${3 + Math.random() * 4}s`,
        size: 2 + Math.random() * 4,
      })),
    );
  }, [scene.particles]);

  return (
    <div
      className="fixed inset-0 bg-cover bg-center"
      style={{ backgroundImage: "url(/zen.jpg)" }}
    >
      {mounted && (
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-white/10 animate-float"
              style={{
                left: p.left,
                bottom: "-10px",
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          ))}
        </div>
      )}
      <div className="absolute right-8 top-1/3 text-6xl opacity-20 select-none">
        {scene.emoji}
      </div>
    </div>
  );
}
