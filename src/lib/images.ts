/** Free-to-use photos from Unsplash (Unsplash License — no attribution required). */
const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=75&w=${w}`;

export const IMAGES = {
  hero: u("1631549916768-4119b2e5f926", 1400),
  pills: u("1587854692152-cbe660dbde88", 1400),
  blister: u("1584308666744-24d5c474f2ae", 1800),
  pharmacy: u("1576602976047-174e57a47881", 1800),
  doctor: u("1576091160399-112ba8d25d1d", 1200),
  checkup: u("1631815588090-d4bfec5b1ccb", 1200),
  supplies: u("1585435557343-3b092031a831", 1400),
} as const;
