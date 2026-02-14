# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PORSEO LMS - a learning management system for PORSEO (PORSEOの学習管理システム). Built with Next.js 16 (App Router) + Convex (serverless backend/database) + Clerk (auth) + Stripe (payments) + Mux (video hosting) + Discord integration.

## Commands

- `npm run dev` - Start Next.js dev server
- `npx convex dev` - Start Convex dev server (run alongside `npm run dev`)
- `npm run build` - Production build
- `npm run lint` - ESLint (flat config, eslint.config.mjs)
- `npm run stripe:listen` - Forward Stripe webhooks to localhost:3000

## Architecture

### Tech Stack
- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui (new-york style)
- **Backend/DB**: Convex (serverless functions + real-time database)
- **Auth**: Clerk → Convex auth integration via `ConvexProviderWithClerk`
- **Payments**: Stripe (checkout sessions, customer portal, webhook handling)
- **Video**: Mux (upload, playback, player)
- **AI**: Google GenAI (`@google/genai`) for video transcription/summarization
- **Discord**: discord.js for role sync and server integration

### Key Directories
- `convex/` - Convex backend: schema, queries, mutations, actions
- `src/app/` - Next.js App Router pages
- `src/app/api/` - Next.js API routes (Stripe, Mux, webhooks, role sync)
- `src/components/` - React components (admin, landing, auth, ui)
- `src/lib/` - Shared utilities (Convex HTTP client, Stripe client, cn util)
- `providers/` - React context providers (ConvexClientProvider with Clerk)

### Data Flow
- **Auth**: Clerk handles login → `UserSync` component syncs user to Convex `users` table → Convex auth validates via Clerk JWT
- **Admin authorization**: Convex functions check `isAdmin` field on users table via `checkAdmin()` helper in `convex/admin.ts`
- **Payments**: Stripe checkout → webhook at `/api/webhooks/stripe` → updates Convex user subscription status
- **Video pipeline**: Mux upload → video record in Convex → optional AI processing (transcription, summary, chapters) → role-gated playback
- **Discord sync**: User roles synced between Discord and Convex via `/api/sync-role` and `convex/discord.ts`

### Database Schema (Convex)
Core tables: `users`, `videos`, `tags`, `videoProgress`, `courses`, `dailyLearningLogs`, `auditLogs`, `transcription_chunks` (with vector index for semantic search)

### Path Aliases
`@/*` maps to `./src/*`

## Conventions

### Commit Messages
Enforced via commitlint + husky. **Commit subjects must be in Japanese** (日本語必須). Format:
```
type: 日本語のサブジェクト
```
Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Example: `feat: ユーザープロフィールページを追加`

### Security
- Middleware implements rate limiting (30 req/min per IP) and CSRF protection on API routes
- Security headers configured in `next.config.ts` (X-Frame-Options, HSTS, etc.)
- Webhook routes excluded from rate limiting (use signature verification instead)
- Convex mutations validate auth via `ctx.auth.getUserIdentity()` and admin check patterns

### Convex Patterns
- Server-side HTTP client: `src/lib/convex.ts` (for API routes)
- Client-side reactive client: `providers/ConvexClientProvider.tsx`
- Admin functions use `checkAdmin()` helper pattern from `convex/admin.ts`
- User lookup by Clerk ID: `getUserByClerkId()` from `convex/users.ts`
