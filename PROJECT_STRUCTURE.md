# MediReach — Project Structure

Next.js (App Router) + Tailwind + shadcn/ui. **No external database**: all data is dummy data held in memory.
The admin panel (`/admin`, `/api/admin/*`) is reachable from **localhost only** (`src/proxy.ts`).

```
src/
├── proxy.ts                  Localhost-only guard for /admin
├── app/
│   ├── (public)/             Public site: home, medicines, medicines/[slug], pharmacies, cart, login, how-it-works
│   ├── patient/              Patient dashboard (overview, prescriptions, orders)
│   ├── doctor/               Doctor dashboard (overview, prescription history, new prescription)
│   ├── pharmacist/           Pharmacist dashboard (overview, inventory, orders)
│   ├── admin/                Admin panel (overview, verifications, medicines, pharmacies, orders, api-docs)
│   └── api/                  REST route handlers (medicines, pharmacies, caution, orders, admin/stats)
├── components/
│   ├── ui/                   shadcn/ui primitives
│   ├── layout/               Site header/footer, dashboard shell
│   ├── medicine/ caution/ cart/ dashboard/ shared/
└── lib/
    ├── types.ts              Domain types
    ├── constants.ts          App constants, formatters
    ├── auth.ts               Demo cookie session + role guard
    ├── data/                 Dummy data + in-memory db (index.ts)
    ├── services/             Business logic (one file per domain) — used by pages AND api routes
    └── actions/              Server actions (forms): auth, admin, doctor, pharmacist
```

Request flow: `page / route handler → service → data/db`. UI never touches data files directly.

## Demo accounts
Passwordless — pick a role on `/login`. Admin: open `http://localhost:3000/admin`.

## Not implemented (future work)
Real DB, real auth, DGDA verification, payments, delivery, LLM phrasing for the caution layer.
