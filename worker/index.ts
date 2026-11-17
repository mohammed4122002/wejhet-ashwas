import handler from "vinext/server/fetch-handler";

type Env = {
  CRON_SECRET?: string;
};

type ExecutionContextLike = {
  waitUntil(promise: Promise<unknown>): void;
};

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContextLike) {
    return handler.fetch(request, env, ctx);
  },

  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContextLike,
  ) {
    if (!env.CRON_SECRET) {
      throw new Error("CRON_SECRET Worker secret is not configured.");
    }

    // Reuse the existing authenticated Next route so the unlock and
    // notification business logic remains in one place.
    const request = new Request(
      "https://wejhet-ashwas.internal/api/cron/time-capsule-unlock",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.CRON_SECRET}`,
        },
      },
    );

    const response = await handler.fetch(request, env, ctx);
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Time-capsule scheduled job failed (${response.status}): ${detail}`,
      );
    }
  },
};
