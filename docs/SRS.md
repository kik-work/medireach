# Software Requirements Specification — MediReach

Version 1.0 · prototype

## 1. Introduction

### 1.1 Purpose

This document specifies what the MediReach prototype does: its users, functions, rules and quality requirements. It is written for the project supervisor, examiners and developers who maintain the code.

### 1.2 Scope

MediReach is a web platform that models online medicine purchase in Bangladesh under a future DGDA framework. It connects patients, doctors, pharmacists and administrators. Its core aims:

1. Make rare and hard-to-find medicines discoverable across all registered pharmacies, nearby first and then nationwide.
2. Link doctor-issued prescriptions to purchases, and block prescription-only (Rx) medicines without a valid prescription.
3. Show an AI caution layer, grounded in a curated database, that warns about duplicate ingredients and interactions and always defers to the doctor.
4. Give each role its own dashboard and permissions.

Out of scope: real DGDA, BMDC or Pharmacy Council verification; real payments and delivery; autonomous diagnosis; integration with health records.

### 1.3 Definitions

| Term | Meaning |
|---|---|
| Rx | Prescription-only medicine. OTC = over the counter. |
| Generic / ingredient | Active substance, e.g. paracetamol. Many brands (Napa, Ace) share one generic. |
| Live medicine | A catalogue entry approved by a verified doctor. Only live medicines can be listed, ordered, prescribed or checked. |
| Valid prescription | Doctor-issued, or uploaded and approved by an admin, and not past its `validUntil` date (30 days after issue). |
| Profile medicines | A patient's valid-prescription items, active refills, and non-cancelled orders of the last 30 days. |
| RAG | Retrieval-augmented generation: facts are retrieved from controlled data, and a language model may only rephrase them. |

## 2. Overall description

### 2.1 Users

| Role | Description | Account approval |
|---|---|---|
| Patient | Searches, orders, uploads prescriptions, books consultations | Active at signup |
| Doctor | Issues prescriptions, consults, reviews new medicines | Pending until an admin verifies the BMDC number |
| Pharmacist | Manages one pharmacy's stock and orders | Pending until an admin verifies the Pharmacy Council number and the pharmacy licence |
| Admin | Verifies accounts and pharmacies, manages the catalogue, reviews uploaded prescriptions, moderates | Seeded account |

### 2.2 Operating environment

A modern desktop or mobile browser. The server runs Node.js 20.9 or later. No database server is needed.

### 2.3 Constraints and assumptions

- Prototype for a regulatory framework that does not fully exist yet.
- Verification, payment and delivery are simulated.
- The medicine database is a curated demonstration set, not national coverage.
- Inventory accuracy depends on pharmacists keeping stock current.

## 3. Functional requirements

Each requirement has an ID used in the use cases ([USE-CASES.md](USE-CASES.md)) and tests (`tests/`).

### 3.1 Accounts and access (FR-A)

| ID | Requirement |
|---|---|
| FR-A1 | A visitor can sign up as patient, doctor or pharmacist with an email or a phone number (10–15 digits) and a password of at least 6 characters. |
| FR-A2 | A doctor must give a BMDC number. A pharmacist must give a Pharmacy Council number, pharmacy name and licence number; the pharmacy is created as pending. |
| FR-A3 | Doctors and pharmacists stay pending, with limited access, until an admin verifies them. |
| FR-A4 | Passwords are stored as salted scrypt hashes. Sessions are HMAC-signed, HTTP-only cookies valid for 7 days. |
| FR-A5 | Every API route checks the signed-in role. Patients see only their own data; pharmacists only their pharmacy's orders; doctors only their own prescriptions and appointments. |
| FR-A6 | The admin signs in at `/admin`. The platform statistics API answers on localhost only. |

### 3.2 Catalogue and search (FR-C)

| ID | Requirement |
|---|---|
| FR-C1 | Search live medicines by brand, generic name, category or disease (use); filter by Rx/OTC and "rare only". |
| FR-C2 | A medicine page shows generic, strength, form, manufacturer, reference price, uses, cautions, side effects, and other brands with the same ingredient. |
| FR-C3 | Availability lists verified pharmacies with stock. With the user's location, pharmacies within 10 km come first, sorted by distance; the rest follow as "further away". Without location, the chosen city comes first and the rest of Bangladesh follows. |
| FR-C4 | An admin or pharmacist can propose a new medicine. It stays hidden until a verified doctor reviews and approves it (adds uses, cautions, side effects, interactions). |
| FR-C5 | Changing the generic, ingredients, strength, form or Rx flag of a live medicine sends it back to review. |

### 3.3 Pharmacy and inventory (FR-P)

| ID | Requirement |
|---|---|
| FR-P1 | A pharmacist sets quantity and price per live medicine for their pharmacy, and edits the pharmacy's details and map position. A pending pharmacist may prepare stock only while the pharmacy is not yet live; rejected or suspended accounts cannot change stock. |
| FR-P2 | Only verified pharmacies appear in availability and accept orders. |
| FR-P3 | An admin verifies, rejects or suspends pharmacies. |

### 3.4 Prescription bridge (FR-R)

| ID | Requirement |
|---|---|
| FR-R1 | A verified doctor issues a digital prescription to a verified patient: diagnosis, and per item a live medicine, dose and days. It is valid for 30 days. |
| FR-R2 | A patient uploads a copy of a paper prescription with a photo or PDF (JPEG, PNG, WebP, PDF, up to 3 MB; the file's first bytes must match its type). |
| FR-R3 | An uploaded copy unlocks Rx medicines only after an admin approves it. An admin can reject it with a reason. |
| FR-R4 | Checkout rejects any Rx-only line whose medicine is not on one of the patient's valid prescriptions. The check runs on the server; the cart also warns in advance. |
| FR-R5 | The uploaded file can be opened by the patient, an admin, and a pharmacist whose pharmacy has an order from that patient. |

### 3.5 Cart, orders and payment (FR-O)

| ID | Requirement |
|---|---|
| FR-O1 | The cart holds lines of (medicine, pharmacy, quantity). Checkout creates one order per pharmacy. |
| FR-O2 | When the pharmacy holds enough stock for every line, the stock is reserved and the order is "placed". Otherwise the order is a "pre-order" and no stock is taken. |
| FR-O3 | Order status moves placed/pre-order → confirmed → packed → delivered, one step at a time, by the pharmacy's verified pharmacist. |
| FR-O4 | The patient can cancel while the order is placed or pre-order; the pharmacist can cancel before delivery; the admin can cancel any open order. Cancelling returns reserved stock. |
| FR-O5 | Payment is simulated. Methods: cash on delivery, bKash, card. bKash needs an 11-digit `01…` number; card needs a Luhn-valid number and a future MM/YY expiry. Declined test numbers return an error and nothing is saved. |
| FR-O6 | Prepaid orders are "paid" at checkout; cash orders become "paid" when delivered. Cancelling a paid order marks it "refunded". Only the last 4 digits and a generated reference are stored. |
| FR-O7 | The patient sees each order with a step tracker and its payment state. |

### 3.6 AI caution layer (FR-AI)

| ID | Requirement |
|---|---|
| FR-AI1 | For a set of medicines, the system retrieves from the curated database: generic name, uses, cautions, Rx status, duplicate active ingredients across brands, and known interactions with severity (minor, moderate, major). |
| FR-AI2 | The caution panel appears on every medicine page and in the cart. |
| FR-AI3 | For a signed-in patient, the check also includes their profile medicines. An alert is shown only when at least one side is on the page or in the cart, and the profile medicine is labelled "on your profile". |
| FR-AI4 | Every output ends with: "This is general information. Follow your doctor's instructions." |
| FR-AI5 | Optional: with an API key configured, a language model (Claude) rephrases the retrieved report in 2–4 plain sentences. It receives only the report, must not add facts, doses or advice, and the disclaimer is appended by code. On any failure the retrieval cards are shown alone. |
| FR-AI6 | The AI never starts, stops or changes a treatment. It only annotates a decision a licensed person already made. |

### 3.7 Refills (FR-F)

| ID | Requirement |
|---|---|
| FR-F1 | A patient subscribes to a refill: medicine, verified pharmacy, packs, interval in days (1–365). |
| FR-F2 | The dashboard reminds the patient of refills due within 7 days. The patient can order a refill at any time. |
| FR-F3 | With auto-order on, the order is placed automatically (cash on delivery) on the due date. The check runs hourly and when the patient opens the dashboard. |
| FR-F4 | An automatic order follows every checkout rule, including Rx gating. A failure is shown to the patient and retried at most once a day. Suspended patients are skipped. |

### 3.8 Consultations (FR-V)

| ID | Requirement |
|---|---|
| FR-V1 | The doctor finder matches a patient's words to specialties from a curated table. It points to a kind of doctor and never diagnoses. |
| FR-V2 | A patient books a video or chat consultation in one of the doctor's free slots. The doctor approves, reschedules or declines. |
| FR-V3 | Chat is saved; the video call is a demonstration only. |
| FR-V4 | The patient attaches test reports (stored files, up to 10 per appointment). Only the patient and that appointment's doctor can open them. |
| FR-V5 | The doctor can issue a prescription linked to the consultation. |

### 3.9 Administration (FR-M)

| ID | Requirement |
|---|---|
| FR-M1 | Verify, reject, suspend or reinstate doctors, pharmacists and pharmacies. A suspended patient cannot order. |
| FR-M2 | Add, edit and remove medicines; see each medicine's review state. |
| FR-M3 | Review uploaded prescriptions. |
| FR-M4 | See all orders and cancel open ones; see platform statistics. |
| FR-M5 | Read the API reference at `/admin/api-docs`. |

## 4. Business rules

| ID | Rule |
|---|---|
| BR-1 | Only live medicines are listed, stocked, prescribed, ordered or checked by the caution layer. |
| BR-2 | A prescription is valid for 30 days from issue. An uploaded copy also needs admin approval. |
| BR-3 | Rx-only medicines cannot be ordered without a valid prescription, by any path (cart, "order now", automatic refill). |
| BR-4 | Only verified pharmacies sell; only verified pharmacists change order status or the stock of a live pharmacy. |
| BR-5 | The AI layer uses only curated data. It does not diagnose or recommend. Every output carries the disclaimer. |
| BR-6 | Full card or wallet numbers are never stored. |

## 5. External interfaces

- **User interface:** responsive web pages for the public site and four dashboards.
- **REST API:** JSON over HTTP under `/api/*`, cookie authentication. Reference at `/admin/api-docs`.
- **Claude API (optional):** one Messages API call per new caution report, only when `ANTHROPIC_API_KEY` is set.
- **Browser geolocation (optional):** used only to sort pharmacies by distance; not stored.

## 6. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 Security | Signed session cookies; role checks on every route; salted password hashes; uploads checked by content signature, size-limited and served with `nosniff` and `no-store`. |
| NFR-2 Privacy | Users only receive the personal data their role needs. For example, a pharmacist sees prescriptions only of patients who ordered from their pharmacy, and test reports are visible only to the appointment's patient and doctor. |
| NFR-3 Safety | No AI output without the disclaimer; no AI-generated facts; Rx gating enforced on the server. |
| NFR-4 Availability | If the language model fails or is not configured, every feature still works. |
| NFR-5 Usability | Layout works on phone width; every form gives a specific error message. |
| NFR-6 Maintainability | Business logic lives in services shared by pages and API routes; the core rules have unit tests (`npm test`). |
| NFR-7 Portability | Runs with `npm install && npm run dev`; no database server. |

## 7. Architecture

```
Browser (React pages)
   │  fetch /api/*  (JSON, session cookie)
   ▼
Next.js route handlers ── auth.ts guard (role, ownership)
   │
   ▼
Services (src/lib/services/*)  ── rules.ts (shared rules)
   │                              caution-phrasing.service ──► Claude API (optional)
   ▼
Data layer (src/lib/data/index.ts) ──► .data/db.json, .data/uploads/
```

The proposal planned Laravel as the REST API and MySQL as the store, with Next.js as the frontend. The prototype keeps that layering but implements the API layer as Next.js route handlers and the store as a JSON file. Reasons: one language and one process for a single-developer academic prototype, no database server to install for examiners, and the services can be tested directly. The service functions are the boundary a Laravel/MySQL port would replace: each route handler maps one-to-one to a Laravel controller action, each `db.*` collection to a MySQL table ([ER-DIAGRAM.md](ER-DIAGRAM.md)), and the UI would keep calling the same REST paths.

## 8. Verification

| Area | Tests |
|---|---|
| Prescription and medicine rules | `tests/rules.test.ts` |
| Caution layer, incl. profile checks and phrasing fallback | `tests/caution.test.ts` |
| Rx gating, stock, pre-orders, status transitions, payment | `tests/orders.test.ts`, `tests/payment.test.ts` |
| Automatic refills | `tests/refills.test.ts` |

Run with `npm test`.
