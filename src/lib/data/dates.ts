/** Seed dates are relative to "now" so sample prescriptions and orders never go stale. */
export const dayOffset = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
