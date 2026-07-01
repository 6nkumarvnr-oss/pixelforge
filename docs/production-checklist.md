# PixelForge Production Checklist

## Secrets

Never store passwords, API keys, Supabase service-role keys, Stripe secrets, or database URLs in source code or chat. Put real values in the Vercel project settings (Production and Preview environments).

Required variables are listed in `.env.example`.

## Supabase

1. Create a Supabase project.
2. Copy the project URL and anon key into the public `VITE_*` variables.
3. Copy the service-role key into server-only variables.
4. Copy the Supabase Postgres connection string into `DATABASE_URL`.
5. Enable email magic-link auth in Supabase Auth settings.

## Prisma/PostgreSQL

The schema lives in `prisma/schema.prisma` and defines:

- `User`
- `Preset`
- `Generation`
- billing plan/status enums

Use the app's package scripts for Prisma generation and migrations in your deployment workflow.

## Stripe

1. Create Pro and Studio recurring prices in Stripe.
2. Add the price IDs to `STRIPE_PRO_PRICE_ID` and `STRIPE_STUDIO_PRICE_ID`.
3. Add a webhook endpoint pointing to `/api/billing/webhook`.
4. Subscribe to these webhook events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Add the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

## Image Providers

- DALL-E uses `OPENAI_API_KEY`.
- SDXL uses `SDXL_API_URL` and optional `SDXL_API_KEY` for a compatible provider endpoint.
- If provider variables are missing or fail, `/api/generate` uses the procedural SVG fallback.

## Launch Gates

- Verify Supabase login/logout.
- Verify Prisma migrations against Supabase Postgres.
- Verify `/api/generate`, `/api/presets`, `/api/history`, `/api/analytics`, `/api/me`.
- Verify Stripe checkout, portal, and webhook subscription sync.
- Verify credits decrement after authenticated generations.
- Verify fallback generation works when provider APIs are unavailable.
