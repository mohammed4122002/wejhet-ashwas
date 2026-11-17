# Cloudflare Workers deployment

This branch is the isolated Cloudflare migration. The original application branch is unchanged.

## Before the first production deployment

1. Create a Cloudflare API token using the **Edit Cloudflare Workers** template. Keep it outside the repository and expose it to the deployment shell as `CLOUDFLARE_API_TOKEN`.
2. Create `.env.production.local` locally with the real public build-time values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY
```

3. Create `.worker-secrets` locally with the server-only Worker secrets:

```dotenv
SUPABASE_SERVICE_ROLE_KEY=YOUR_ROTATED_SERVICE_ROLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
VAPID_PRIVATE_KEY=YOUR_VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:YOUR_ADMIN_EMAIL
CRON_SECRET=YOUR_LONG_RANDOM_CRON_SECRET
ADMIN_EMAILS=admin@example.com
```

Do not commit either file or paste secret values into chat. The service-role key previously exposed in a conversation should be rotated before use.

## First deployment

The Worker declares required secrets with `bindings.secret()`. Cloudflare's first deployment needs those values supplied at deployment time:

```bash
npm ci
npm run build:vinext
npx cf deploy --prebuilt --mode production --secrets-file .worker-secrets
```

After the first deployment, the normal application deployment command is:

```bash
npm run deploy:vinext
```

The public `NEXT_PUBLIC_*` values must be present during the production build because they are inlined into browser code. Server-only values belong in `.worker-secrets` / Cloudflare Worker Secrets, never in `NEXT_PUBLIC_*`.

## Scheduled job

The existing time-capsule unlock API is invoked by a Cloudflare Cron Trigger at **06:00 UTC daily**. The Worker calls the existing authenticated route with `CRON_SECRET`; no Vercel Cron is required.

## After deployment

- Copy the actual `workers.dev` URL printed by Cloudflare.
- Update `server.url` in `capacitor.config.ts` from the old Vercel URL to that verified Cloudflare URL before building the Android app.
- Test login/session refresh, Supabase reads/writes, PDF extraction, push subscribe/unsubscribe, and the scheduled unlock path on the deployed Worker.
