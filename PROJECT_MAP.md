# PROJECT_MAP — VORA App

## TECH_STACK
- Runtime: Node.js v24.14.1
- Framework: Next.js 16.2.6 (App Router) + TypeScript 5.9.3
- UI: React 19.2.6 + Tailwind CSS 4.3.0
- AI: LangChain 1.4.0 + LangGraph 1.3.0 + Anthropic Claude (claude-sonnet-4)
- i18n: next-intl 4.12.0 (10 langues: en, fr, es, de, it, pt, ar, zh, ja, ru)
- Speech: Web Speech API (native browser)
- DB: Prisma 7.8.0 + PostgreSQL
- Auth: Auth.js v5 (anonyme + Google OAuth)
- Validation: Zod 4.3.6
- Logging: Pino 9.x (async, redacted)
- Testing: Vitest 4.x (unit) + Playwright 1.52.x (e2e)

## SYSTEM_FLOW
```
Landing (/[locale]) → Sélection Langue
  → Start Talking → /[locale]/chat
    → InputModeSelector (Write | Speak)
      → Write: textarea + Send button
      → Speak: VoiceRecorder (Web Speech API)
    → POST /api/chat
      → classifyEmotion() → problem domain + crisis level
      → detectCrisis() → escalation if needed
      → generateTherapeuticResponse() → Dr. Sarah Chen persona
    → BackgroundScene updates (gradient + particles per domain)
    → CrisisAlert modal (if high/critical)
    → Continue loop (encouragement to vent)
```

## ARCHITECTURE
```
src/
├── app/
│   ├── [locale]/               # i18n routes (SSG)
│   │   ├── layout.tsx           # NextIntlClientProvider
│   │   ├── page.tsx             # Landing page
│   │   └── chat/page.tsx        # Chat page
│   ├── api/
│   │   ├── chat/route.ts        # POST /api/chat
│   │   └── auth/[...nextauth]/  # Auth.js handler
│   ├── globals.css              # Tailwind v4 + keyframes
│   └── layout.tsx               # Root layout
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx    # Main orchestrator
│   │   ├── InputModeSelector.tsx # Write/Speak toggle
│   │   ├── VoiceRecorder.tsx    # Web Speech API STT
│   │   ├── MessageBubble.tsx    # Chat messages + domain tags
│   │   ├── BackgroundScene.tsx  # Dynamic gradient/particles
│   │   ├── CrisisAlert.tsx      # Crisis escalation modal
│   │   └── LanguageSelector.tsx # 10-lang dropdown
│   └── ui/                      # Base UI primitives
├── lib/
│   ├── ai/
│   │   ├── agent.ts             # LangChain agent (classify, detect, respond)
│   │   └── prompts.ts           # (future) prompt templates
│   ├── db/
│   │   ├── client.ts            # PrismaClient singleton
│   │   └── queries.ts           # DB operations
│   ├── speech/
│   │   ├── recognition.ts       # STT abstraction
│   │   └── synthesis.ts         # TTS abstraction
│   ├── crisis.ts                # Crisis hotline data (pure)
│   ├── auth.ts                  # NextAuth config
│   └── logging.ts               # Pino logger
├── i18n/
│   ├── routing.ts               # defineRouting + navigation exports
│   └── request.ts               # next-intl message loader
├── middleware.ts → proxy.ts     # Locale detection (deprecated rename)
└── types/
    └── index.ts                 # Shared TypeScript types
messages/
├── en.json, fr.json, es.json... # 10 locale files
prisma/
├── schema.prisma                # User, Session, Message, CrisisAlert
└── config.ts (at root)          # Prisma 7 datasource config
```

## MILESTONES STATUS

| Milestone | Status | Key Files |
|-----------|--------|-----------|
| M1: Foundation (Next.js + i18n + DB + Auth) | ✅ DONE | package.json, tsconfig, next.config, prisma, auth |
| M2: Core AI (LangChain agent + prompts) | ✅ DONE | agent.ts, crisis.ts |
| M3: Chat UI (components + wiring) | ✅ DONE | ChatContainer.tsx + all chat components |
| M4: Speech (STT/TTS abstraction) | ✅ DONE | recognition.ts, synthesis.ts |
| M5: Production (logging + tests + build) | ✅ DONE | logging.ts, vitest, playwright |

## ORPHANS & PENDING
- [DONE] ~~Tests unitaires (21 tests pass)~~ — ✅ Verified May 14, 2026
- [PENDING] Anthropic API key configuration required before /api/chat works
- [PENDING] PostgreSQL must be running + `npx prisma db push` for DB tables
- [PENDING] Playwright e2e tests require `npx playwright install` (browsers)
- [PENDING] Azure Speech Services credentials for fallback STT/TTS polyfill
- [PENDING] Professional translation review for 10 languages (current: automated)
- [PENDING] RGPD compliance review for EU deployment
