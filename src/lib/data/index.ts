import { medicines } from "./medicines";
import { pharmacies } from "./pharmacies";
import { stock } from "./stock";
import { users } from "./users";
import { prescriptions } from "./prescriptions";
import { orders } from "./orders";
import { interactions } from "./interactions";

/**
 * In-memory "database". Seeded from the files in this folder and cached
 * on globalThis so admin actions survive hot reloads. Resets on server restart.
 * No external database is used in this project.
 */
const seed = () => ({
  medicines: structuredClone(medicines),
  pharmacies: structuredClone(pharmacies),
  stock: structuredClone(stock),
  users: structuredClone(users),
  prescriptions: structuredClone(prescriptions),
  orders: structuredClone(orders),
  interactions,
});

type Db = ReturnType<typeof seed>;
const g = globalThis as unknown as { __medireachDb?: Db };

export const db: Db = (g.__medireachDb ??= seed());
