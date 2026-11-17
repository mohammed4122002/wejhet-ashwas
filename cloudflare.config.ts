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
    },
  }),
});
