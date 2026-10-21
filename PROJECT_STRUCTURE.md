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

## Consultation module

Patient flow: find a doctor (AI finder or browse by specialty) → book → chat or demo video call → attach test reports → doctor writes a digital prescription → patient orders the medicine.

- Patient pages: `/patient/doctors`, `/patient/appointments`, `/patient/appointments/[id]` (consultation room).
- Doctor pages: `/doctor/appointments` (approve, reschedule, decline, practice profile), `/doctor/appointments/[id]`.
- Each specialty has several seeded doctors (`lib/data/doctors.ts`). A doctor who is on leave or fully booked stays listed, and the patient sees the others next to them.
- The finder (`services/triage.service.ts`) matches words to the curated table in `lib/specialties.ts`. It points to a kind of doctor and never diagnoses.
- Chat is real (saved, polled every 3 s). The video call is a demo: no audio or video is sent. Report uploads save the file name only.

## Medicine approval

The admin adds a medicine with its basic details (brand, generic, strength, form, price, Rx). It starts as **pending** and is hidden everywhere: catalogue, search, cart, orders, prescriptions, stock and the AI caution layer. A **verified doctor** reviews it at `/doctor/medicines`, writes the description, uses, cautions, side effects and interactions, and approves it. Only then it goes live. A doctor can also reject it with a reason; the admin edits it and it returns to review.

- `Medicine.review` holds the state. No `review` means approved (the starter catalogue). `isMedicineLive` in `lib/rules.ts` is the one check.
- Editing generic, ingredients, strength, form or Rx of a live medicine sends it back to review. Price, brand and manufacturer edits do not.
- Interactions a doctor adds are saved with `source = medicineId` and replaced when the medicine is reviewed again.

## Demo accounts
Passwordless — pick a role on `/login`. Admin: open `http://localhost:3000/admin`.

## Not implemented (future work)
Real DB, real auth, DGDA verification, payments, delivery, LLM phrasing for the caution layer.
