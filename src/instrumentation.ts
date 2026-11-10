/**
 * Runs once when the Next.js server starts. Starts an hourly timer that places the orders of
 * refills with auto-order switched on once they are due (src/lib/services/refill.service.ts).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { runDueRefills } = await import("@/lib/services/refill.service");
  const tick = () => {
    try {
      const runs = runDueRefills();
      if (runs.length) console.log(`[refills] ${runs.filter((r) => r.ok).length} placed, ${runs.filter((r) => !r.ok).length} failed`);
    } catch (error) {
      console.error("[refills] automatic run failed", error);
    }
  };
  tick();
  setInterval(tick, 60 * 60 * 1000).unref();
}
