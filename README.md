# PixelForge

AI image generation studio — part of the **ValorStruct / Meiveeram** application ecosystem.

## What it does

Users craft prompts with curated presets, generate images (DALL-E / SDXL, with a deterministic SVG fallback), save favorites, remix past generations, and manage projects/brand kits/creative briefs in the Production Studio workspace. Billing runs on Stripe (or a manual payment beta flow) with a credits-based plan system.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Nitro server (API routes in `server/routes/api/`)
- **Database:** Supabase Postgres via Prisma ORM
- **Auth:** Supabase Auth (magic-link email OTP)
- **Payments:** Stripe (Checkout, Billing Portal, Webhooks)
- **AI providers:** OpenAI DALL-E 3, SDXL endpoint, deterministic SVG fallback

See `APP_OVERVIEW.md` for full architecture, feature status, and security model.

## Local development

```bash
pnpm install
pnpm db:generate
pnpm dev
```

Copy `.env.example` to `.env` and fill in real values (Supabase, Stripe, AI provider keys) — see `docs/production-checklist.md` for the full setup guide. Never commit real secrets; production values live in Vercel project settings.

## Admin access

Super admin access is restricted to the ValorStruct/Meiveeram ecosystem admin emails (see `server/lib/admin.ts`).
