/**
 * تأثيرات بصرية احتفالية عند إنجاز المهام.
 * يعمل فقط في المتصفح — safe to import server-side (no-op).
 */

type ConfettiFn = (opts?: {
  particleCount?: number;
  spread?: number;
  angle?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
}) => Promise<undefined> | null;

let confettiFn: ConfettiFn | null = null;

async function getConfetti(): Promise<ConfettiFn | null> {
  if (typeof window === "undefined") return null;
  if (!confettiFn) {
    const mod = await import("canvas-confetti");
    confettiFn = mod.default as unknown as ConfettiFn;
  }
  return confettiFn;
}

/** انفجار صغير عند إتمام مهمة واحدة */
export async function fireTaskComplete() {
  const confetti = await getConfetti();
  if (!confetti) return;
  confetti({
    particleCount: 40,
    spread: 55,
    origin: { y: 0.7 },
    colors: ["#6C63FF", "#A78BFA", "#34D399", "#FBBF24"],
  });
}

/** انفجار كبير عند إنجاز كل مهام اليوم */
export async function fireAllDayComplete() {
  const confetti = await getConfetti();
  if (!confetti) return;
  const end = Date.now() + 800;
  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#6C63FF", "#A78BFA", "#34D399"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#FBBF24", "#F87171", "#6C63FF"],
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

/** تأثير عند فتح شارة جديدة */
export async function fireBadgeUnlocked() {
  const confetti = await getConfetti();
  if (!confetti) return;
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.5 },
    colors: ["#FFD700", "#FFA500", "#FF6347"],
  });
}
