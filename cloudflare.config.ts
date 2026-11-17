import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "wejhet-ashwas",
    // Custom entrypoint keeps the Vinext HTTP handler and adds the scheduled() event.
    entrypoint: "./worker/index.ts",
    compatibilityDate: "2026-11-17",
    triggers: [triggers.scheduled({ schedule: "0 6 * * *" })],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      // Public values are supplied at build time and also exposed to server code.
      NEXT_PUBLIC_SUPABASE_URL: bindings.text(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: bindings.text(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""),
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: bindings.text(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""),
      // Server-only credentials are required Worker secrets; never commit their values.
      SUPABASE_SERVICE_ROLE_KEY: bindings.secret(),
      OPENAI_API_KEY: bindings.secret(),
      VAPID_PRIVATE_KEY: bindings.secret(),
      VAPID_SUBJECT: bindings.secret(),
      CRON_SECRET: bindings.secret(),
      ADMIN_EMAILS: bindings.secret(),
    },
  }),
});
