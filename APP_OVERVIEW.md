# PixelForge — App Overview & Technical Documentation

> Saved for future reference. Last updated after the component refactor, super-admin feature, and ownership-check fix.

## What is PixelForge?

PixelForge is a **full-stack AI image generation studio**. Users craft prompts with curated presets, generate images through AI providers (DALL-E / SDXL with an SVG fallback), save favorites, remix past generations, and upgrade plans via Stripe billing.

**Yes, this is a true full-stack app:**

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Nitro server (API routes in `server/routes/api/`) |
| Database | Supabase Postgres via Prisma ORM |
| Auth | Supabase Auth (magic-link email OTP, JWT verified server-side) |
| Payments | Stripe (Checkout, Billing Portal, Webhooks) |
| AI providers | OpenAI DALL-E 3, SDXL endpoint, deterministic SVG fallback |

## Feature Status (verified working)

| Feature | Status | Notes |
|---|---|---|
| API endpoints (`/api/me`, `/api/presets`, `/api/history`, `/api/analytics`) | ✅ Working | All return 200, no server errors |
| Preset library (search, filter, load) | ✅ Working | Built-in + custom DB presets |
| Prompt builder (positive/negative, quality score, enhance) | ✅ Working | |
| Image generation | ✅ Working | Falls back to SVG art unless `OPENAI_API_KEY` / `SDXL_API_URL` is set |
| Credits system | ✅ Working | 25 FREE / 500 PRO / 2500 STUDIO; decrements per generation |
| History, favorites, remix | ✅ Working | Favorites now ownership-checked server-side |
| Login (Supabase magic link) | ✅ Working | Verified earlier in setup |
| Super admin (owner email) | ✅ Working | Unlimited credits, Admin tab |
| Admin payment settings | ✅ Working | Stored in `admin_payment_settings` table, super-admin-only API |
| Stripe billing (checkout/portal/webhook) | ⚙️ Code complete | Requires `STRIPE_SECRET_KEY`, price IDs, and webhook secret env vars to activate |
| Real AI image providers | ⚙️ Code complete | Requires `OPENAI_API_KEY` or `SDXL_API_URL` env vars |

## Frontend Structure (`src/`)

- `pages/Index.tsx` — Main studio page: state management, header, prompt builder, live canvas
- `components/pixelforge/GuideSection.tsx` — "How to use this app" navigation cards
- `components/pixelforge/PresetLibrary.tsx` — Left sidebar: search, category filters, preset cards
- `components/pixelforge/HistoryPanel.tsx` — Right sidebar: history, favorites, remix
- `components/pixelforge/AdminPanel.tsx` — Super-admin payment administration UI
- `lib/pixelforge-api.ts` — Typed API client (attaches Supabase JWT to every request)
- `lib/studio-data.ts` — Preset data, types, constants, API-to-UI mappers
- `lib/fallback-art.ts` — Deterministic SVG art generator (client fallback)
- `lib/supabaseClient.ts` — Supabase browser client (anon key only)

## Backend Structure (`server/`)

- `routes/api/me.get.ts` — Current user profile (credits, plan, role)
- `routes/api/presets.get.ts` / `presets.post.ts` — Preset listing/creation
- `routes/api/generate.post.ts` — Image generation + credit consumption
- `routes/api/history.get.ts` / `history/[id].patch.ts` — History + favorite toggling (ownership-checked)
- `routes/api/analytics.get.ts` — Usage analytics
- `routes/api/billing/checkout.post.ts` / `portal.post.ts` / `webhook.post.ts` — Stripe (webhook signature verified)
- `routes/api/admin/payment-settings.get.ts` / `.patch.ts` — Super-admin-only payment settings
- `lib/admin.ts` — Super admin email check (`6nkumar.vnr@gmail.com`)
- `lib/auth.ts` — JWT verification via Supabase service role
- `lib/config.ts` — Env var access (`NITRO_` prefix supported)
- `lib/prisma.ts` — Lazy Prisma client singleton
- `lib/pixelforge-db.ts` — All database operations
- `lib/pixelforge-store.ts` — In-memory fallback store + server SVG generator
- `lib/image-providers.ts` — DALL-E / SDXL / fallback provider chain

## Database (Supabase Postgres, Prisma)

- `users` — id, email, credits, plan, subscription status, Stripe IDs, favorites
- `presets` — custom presets (global when `user_id` is null)
- `generations` — prompt, negative, image URL, metadata JSON, favorite flag
- `admin_payment_settings` — singleton row; RLS enabled, service-role-only access

## Security Model

- Browser only holds the Supabase **anon key**; service role key stays server-side
- Every API request passes the user JWT; server verifies it with `supabase.auth.getUser`
- Super admin enforced **on the server** by email match — UI checks are cosmetic only
- Stripe webhook signatures verified before applying plan changes
- Favorite updates ownership-checked (users can only modify their own generations)
- Secret keys and bank details are never collected in the browser

## Special Behavior

- **Owner account:** `6nkumar.vnr@gmail.com` = SUPER_ADMIN → unlimited credits, STUDIO plan display, Admin tab
- **Fallback mode:** if the API/database is unavailable, the app still works with localStorage history and client-side SVG art generation
- **Environment variables needed for full activation:** `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_STUDIO_PRICE_ID`, `OPENAI_API_KEY` (or `SDXL_API_URL`/`SDXL_API_KEY`), `SITE_URL` (each also works with `NITRO_` prefix)
