# MediReach — Project Structure

Next.js 16 (App Router) + Tailwind + shadcn/ui. **No external database**: all data lives in one JSON file, `.data/db.json`, created from the seed files in `src/lib/data/` on first run (delete `.data/` to reset). Uploaded prescription and test-report files are stored in `.data/uploads/`. `MEDIREACH_DATA_DIR` moves the folder.

```
src/
├── proxy.ts                  Localhost-only guard for /api/admin/*
├── instrumentation.ts        Server start: hourly timer for automatic refills
├── app/
│   ├── (public)/             Public site: home, medicines, medicines/[slug], pharmacies, cart, login, signup, how-it-works
│   ├── patient/              Patient dashboard: overview, prescriptions, orders, refills, doctors, appointments
│   ├── doctor/               Doctor dashboard: overview, prescriptions, new prescription, medicine review, appointments
│   ├── pharmacist/           Pharmacist dashboard: overview, inventory, orders, pharmacy profile
│   ├── admin/                Admin panel: overview, verifications, medicines, pharmacies, orders, api-docs (own login)
│   └── api/                  REST route handlers (see /admin/api-docs)
├── components/
│   ├── ui/                   shadcn/ui primitives
│   ├── layout/               Site header/footer, dashboard shell
│   ├── auth/ cart/ caution/ consult/ dashboard/ medicine/ shared/
└── lib/
    ├── types.ts              Domain types
    ├── constants.ts          App constants, formatters
    ├── rules.ts              Shared rules: dates, prescription validity, medicine "live" check
    ├── auth.ts               Signed session cookie + role guard for route handlers
    ├── password.ts           scrypt password hashing
    ├── uploads.ts            File upload checks (type sniffing, 3 MB) and storage
    ├── rate-limit.ts         In-memory rate limit (caution phrasing)
    ├── data/                 Seed data + the JSON database (index.ts)
    └── services/             Business logic, one file per domain, used by pages AND route handlers
tests/                        Vitest unit tests for the services and rules
docs/                         SRS, ER diagram, use cases, user guide, regulatory notes
```

Request flow: `page / route handler → service → data/db`. UI never touches data files directly.

## AI caution layer

`services/caution.service.ts` builds the report from the curated tables only: uses and cautions of each medicine, duplicate active ingredients, interactions from `data/interactions.ts`, and which items are Rx-only.

- For a signed-in patient it also checks the medicines on their profile: valid prescriptions, active refills and non-cancelled orders of the last 30 days. An alert is reported only when at least one side is a medicine on the page or in the cart; profile medicines get no caution card of their own.
- `services/caution-phrasing.service.ts` is the optional generation step. With `ANTHROPIC_API_KEY` set, Claude rewrites the report in two to four plain sentences. It gets the report as its only source, is told to add no facts, doses or advice, and the fixed disclaimer is appended by code. Results are cached per report; failures fall back silently to the cards. `/api/caution/summary` is rate limited to 20 calls per minute per user or address.

## Orders and payment

- `placeOrder` creates one order per pharmacy. Rx-only lines need a valid prescription. A pharmacy that cannot cover every line gets a pre-order and no stock is taken.
- Payment is simulated in `services/payment.service.ts`: cash on delivery (paid when the pharmacist marks the order delivered), bKash or card (paid at checkout). Only the method, last 4 digits and a generated reference are stored. Cancelling refunds a prepaid order.

## Refills

A refill is a chronic-medicine subscription. By default the patient confirms each order. With `autoOrder` on, `runDueRefills` places the order on the due date (cash on delivery). It runs hourly from `instrumentation.ts` and whenever the patient opens their dashboard or refill list. A failed attempt (for example, an expired prescription) is saved in `lastError`, shown to the patient, and retried the next day.

## Consultation module

Patient flow: find a doctor (AI finder or browse by specialty) → book → chat or demo video call → attach test reports → doctor writes a digital prescription → patient orders the medicine.

- Patient pages: `/patient/doctors`, `/patient/appointments`, `/patient/appointments/[id]` (consultation room).
- Doctor pages: `/doctor/appointments` (approve, reschedule, decline, practice profile), `/doctor/appointments/[id]`.
- Each specialty has several seeded doctors (`lib/data/doctors.ts`). A doctor who is on leave or fully booked stays listed, and the patient sees the others next to them.
- The finder (`services/triage.service.ts`) matches words to the curated table in `lib/specialties.ts`. It points to a kind of doctor and never diagnoses.
- Chat is real (saved, polled every 3 s). The video call is a demo: no audio or video is sent. Test reports are stored (JPEG, PNG, WebP or PDF, up to 3 MB) and only the patient and doctor of the appointment can open them.

## Medicine approval

The admin adds a medicine with its basic details (brand, generic, strength, form, price, Rx). It starts as **pending** and is hidden everywhere: catalogue, search, cart, orders, prescriptions, stock and the AI caution layer. A **verified doctor** reviews it at `/doctor/medicines`, writes the description, uses, cautions, side effects and interactions, and approves it. Only then it goes live. A doctor can also reject it with a reason; the admin edits it and it returns to review.

- `Medicine.review` holds the state. No `review` means approved (the starter catalogue). `isMedicineLive` in `lib/rules.ts` is the one check.
- Editing generic, ingredients, strength, form or Rx of a live medicine sends it back to review. Price, brand and manufacturer edits do not.
- Interactions a doctor adds are saved with `source = medicineId` and replaced when the medicine is reviewed again.

## Demo accounts

See [README.md](README.md#demo-accounts). Passwords are in `lib/data/accounts.ts` and are hashed when the database is first created.

## Not implemented (future work)

MySQL or another real database, a Laravel API, real DGDA/BMDC/Pharmacy Council verification, real payment gateway (bKash, SSLCommerz), delivery logistics, real video calls, health-record integration, mobile app.
