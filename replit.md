# JARVIS A.I

A Georgian-language AI chat assistant — Next.js 14 app with Supabase Auth, a free trial paywall, and a Supabase Edge Function that routes all AI calls through Anthropic.

## Run & Operate

- `pnpm --filter @workspace/jarvis run dev` — run the JARVIS frontend (port 3000, webview)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend:** Next.js 14 (App Router), React 18
- **Auth:** Supabase Auth — Google OAuth + email magic link
- **DB:** Supabase (PostgreSQL) — tables: `users`, `chat_messages`, `trial_usage`, `subscriptions`
- **AI:** Anthropic Claude via Supabase Edge Function `Jarvis-chat` (never called directly from client)
- **Backend API:** Express 5 (shared `api-server` artifact)
- Build: Next.js / esbuild

## Where things live

```
artifacts/jarvis/
├── app/
│   ├── layout.tsx          # Root layout — Google Fonts, lang="ka", globals.css
│   ├── page.tsx            # Root page — auth state listener, view switching
│   └── auth/callback/      # OAuth callback route (redirects to root)
├── components/
│   ├── AuthView.tsx        # Auth screen — Google OAuth + magic link + plan picker
│   ├── ChatView.tsx        # Full chat UI — sidebar, messages, paywall, theme toggle
│   └── GeorgianFlag.tsx    # Animated waving Georgian flag (reusable)
├── lib/
│   ├── supabase.ts         # Typed Supabase singleton + constants (URLs, FREE_LIMIT, RESET_MS)
│   └── database.types.ts   # Hand-written DB types for Supabase typed client
└── styles/
    └── globals.css         # All CSS — dark/light themes, cyberpunk aesthetic
```

## Architecture decisions

- All AI calls route through `SUPABASE_URL/functions/v1/Jarvis-chat` — Anthropic is never called directly from the browser.
- Free trial is tracked in the `trial_usage` Supabase table (5 messages per 8-hour window), checked on every send.
- Supabase client is a typed singleton (`createClient<Database>`) — `database.types.ts` defines the shape manually since there is no auto-generated schema.
- Theme (dark/light) is persisted in `localStorage` under `jarvis_theme`; applied as `body.light` class. Initialized in root `page.tsx` to avoid FOUC.
- Conversation history is kept in a `useRef` (not state) to avoid re-renders on every message and to always have the latest value during async send.

## Product

- Georgian-language chat interface with animated waving flag and cyberpunk dark aesthetic.
- Supabase Auth: Google OAuth and email magic link.
- Free trial: 5 messages / 8 hours; paywall card appears with Pro (₾20/mo) and Max (₾40/mo) upgrade options.
- Subscription status is checked in the `subscriptions` table (`status = 'active'`).
- `subscribe()` creates a `pending` subscription; redirect to payment provider (Stripe/BOG) is a TODO stub.
- Light/dark theme toggle with star animation.
- File attachment support (UI only — filename shown in message; no upload to storage yet).
- Chat history loaded from `chat_messages` table on login (last 20 messages).
- "ჯარვისის შექმნის ისტორია" sidebar item loads a hardcoded demo story conversation.

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable anon key |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The Supabase Edge Function `Jarvis-chat` must be deployed to the Supabase project for AI responses to work. Until then, the app falls back to a "not deployed" message.
- Payment redirect URLs in `subscribe()` (ChatView.tsx) are stub TODOs — replace with real Stripe/BOG Pay links before going live.
- `database.types.ts` must be updated whenever new Supabase tables/columns are added, otherwise Supabase queries will lose type safety.
- Next.js 14 requires React 18 — the workspace catalog pins React 19 for Expo; `@workspace/jarvis` pins its own React 18 explicitly.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
