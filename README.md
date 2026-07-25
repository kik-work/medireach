# Project Proposal

## MediReach — A Future-Vision Platform for Digital Medicine Access in Bangladesh

*(MediReach is a working title — rename freely.)*

---

## 1. Introduction

Access to medicine in Bangladesh still depends almost entirely on physically visiting a pharmacy. This works for common medicines but fails badly for rare, low-demand, or specialist drugs, which most shops do not keep in stock. A patient who needs an uncommon medicine may have to travel across the city — or across districts — to find a single pharmacy that carries it.

MediReach is a **future-vision web platform** that models how the online purchase of medicine in Bangladesh could work once government and regulatory frameworks (the Directorate General of Drug Administration, DGDA) formally support it. It is designed as an academic prototype: it demonstrates the architecture, user flows, and safety design of a national digital medicine marketplace, rather than operating as a live commercial pharmacy.

The platform connects registered pharmacies, doctors, and patients in one system, makes hard-to-find medicines discoverable and orderable across locations, and introduces an **AI caution layer** that provides information and safety warnings about medicines — always downstream of a doctor's decision, never as a replacement for one.

---

## 2. Problem Statement

The current medicine-purchase experience in Bangladesh has several gaps:

- **Rare medicines are hard to locate.** No central system shows which pharmacy, anywhere in the country, currently stocks a specific medicine.
- **No digital prescription flow.** Prescriptions are paper-based, easily lost, and not linked to purchases.
- **Brand confusion causes risk.** Many brands share the same active ingredient (for example, ACE and Napa are both paracetamol), and patients may unknowingly double-dose.
- **Limited access to medicine information.** Patients rarely receive clear, structured cautions, interactions, or usage guidance at the point of purchase.
- **The online pharmacy market is underdeveloped.** Online pharmacies currently hold well under one percent of the national pharmaceutical market, indicating large unmet potential.

MediReach addresses these gaps as a coherent, forward-looking design.

---

## 3. Motivation and Rationale

This project treats digital medicine access as an inevitability worth designing for in advance. As Bangladesh advances its digital-health agenda and the DGDA develops guidelines — including a recently approved guideline on the regulation of AI and medical robotics in healthcare — a well-designed model of a compliant, safe online medicine system has clear academic and social value.

The strongest justification is accessibility: **making rare and hard-to-find medicines reachable through a nationwide online inventory.** This is a real problem that physical retail cannot solve, and it forms the core thesis of the project.

---

## 4. Aim and Objectives

**Aim:** To design and build a prototype web platform demonstrating a safe, role-based system for discovering, prescribing, and purchasing medicine online in Bangladesh, with an AI-assisted information and caution layer.

**Objectives:**

1. To build a searchable, location-aware marketplace where pharmacies list medicine inventory and users find nearby or nationwide availability.
2. To implement a prescription bridge that links doctor-issued prescriptions to purchasable medicine, gating prescription-only drugs.
3. To design an AI caution layer that presents medicine information, cautions, interactions, and duplicate-ingredient warnings, grounded in a curated medicine database.
4. To implement secure, role-based access for doctors, pharmacists, patients, and administrators.
5. To document the regulatory and safety considerations a real-world deployment would require.

---

## 5. Scope

**In scope:**

- Medicine catalogue organised by generic name, brand, and disease category
- Pharmacy registration and inventory management with location data
- Medicine search with nearby-and-national availability
- Doctor prescription creation and patient prescription upload
- Cart, order, and pre-order flow (simulated payment)
- AI caution layer grounded in a curated medicine information database
- Role-based dashboards for all user types
- Admin and compliance management

**Out of scope (stated as future work):**

- Real DGDA license verification and live regulatory integration
- Real payment gateway and live medicine delivery logistics
- Autonomous medical diagnosis by AI
- Real patient health-record integration

Stating this scope explicitly is deliberate: MediReach designs for a future regulatory framework rather than claiming to operate within today's one.

---

## 6. Proposed System Overview

The system is organised in four conceptual layers:

**Layer 1 — Marketplace.** Pharmacies register and upload inventory with location and price. Users search for a medicine and see which pharmacies stock it, starting nearby and widening nationally for rare medicines.

**Layer 2 — Prescription bridge.** A patient receives or uploads a doctor's prescription. Prescribed medicines become a purchasable list. Prescription-only medicines cannot be bought without a valid prescription on file; over-the-counter medicines can.

**Layer 3 — AI caution layer.** When a user views or is about to buy a medicine, the AI presents: the generic name and what the medicine treats, standard cautions, interaction warnings against other items in the cart or profile, and duplicate-ingredient alerts. Every AI output is grounded in a curated database (retrieval, not free generation) and ends with a clear notice to follow the doctor's instructions. **The AI informs; the doctor decides.**

**Layer 4 — Roles and trust.** Doctor, pharmacist, patient, and admin, each with their own dashboard and permissions. In a real deployment these would map to BMDC, Pharmacy Council, and DGDA verification — noted here as a design consideration.

---

## 7. User Roles

| Role | Core capabilities |
|------|-------------------|
| **Patient / User** | Search medicine, view availability and info, upload prescriptions, order and pre-order, view AI cautions |
| **Doctor** | Register (verified), create digital prescriptions for patients, view own prescription history |
| **Pharmacist / Pharmacy** | Register (verified), manage inventory and prices, receive and fulfil orders |
| **Admin / Compliance** | Verify doctors and pharmacies, manage the medicine database, moderate listings, suspend bad actors |

---

## 8. Key Features

- Medicine search by brand, generic name, or disease category
- Location-aware availability (nearby first, national for rare medicines)
- Digital prescription creation and upload, with Rx-only gating
- AI caution cards: information, warnings, interactions, duplicate-ingredient alerts
- Cart, order, pre-order, and order tracking (simulated)
- Role-based dashboards
- Admin verification and medicine-database management
- Subscription option for chronic-medicine refills (recurring access, future-facing)

---

## 9. The AI Caution Layer (Design Principle)

The single most important safety decision in this project: **the AI never initiates a treatment decision. It only annotates a decision a licensed human already made.**

To prevent AI hallucination — a real risk if a language model invents doses or misses interactions — the AI does **not** generate medical facts freely. Instead it retrieves them from a curated medicine database maintained by the admin, and (optionally) uses a language model only to phrase those retrieved facts conversationally. This approach is known as **Retrieval-Augmented Generation (RAG)**: the model answers from controlled, trusted data rather than from open generation.

Every AI response ends with: *"This is general information. Follow your doctor's instructions."*

---

## 10. Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Backend / API** | Laravel (PHP) | Mature, secure, excellent for role-based auth, REST APIs, and rapid development |
| **Frontend** | Next.js (React) | Server-side rendering, fast routing, strong ecosystem, SEO-friendly |
| **Styling** | Tailwind CSS | Utility-first, fast, consistent design |
| **UI Components** | shadcn/ui | Accessible, modern, customisable components |
| **Database** | MySQL | Reliable relational database, strong fit for structured medicine, order, and user data |

Architecture: Laravel serves as a REST API and business/authentication layer; Next.js consumes that API and renders the interface; MySQL stores all persistent data. This decoupled (headless) design keeps frontend and backend independent and maintainable.

---

## 11. Methodology

The project follows an **iterative, incremental (Agile-style) approach**:

1. Requirement analysis and system design (ER diagram, use cases, wireframes)
2. Database and Laravel API setup with authentication and roles
3. Core marketplace and medicine catalogue
4. Prescription bridge and ordering
5. AI caution layer over the curated database
6. Admin and verification dashboards
7. Testing, documentation, and refinement

Each module is built, tested, and reviewed before the next begins.

---

## 12. Expected Outcomes

- A working prototype web application demonstrating the full concept
- A curated medicine information database
- A functioning AI caution layer grounded in that database
- Complete documentation: SRS, ER diagram, API documentation, and user guide
- A written analysis of the regulatory and safety requirements for real deployment

---

## 13. Limitations and Assumptions

- The platform is a **prototype for a future regulatory framework** that does not fully exist today; it is not a live pharmacy.
- License verification, payment, and delivery are **simulated**, not real.
- The AI provides **information and cautions only**; it cannot examine a patient or diagnose, and it does not replace a doctor.
- The medicine database is curated for demonstration and is not exhaustive.
- Inventory accuracy in a multi-pharmacy model depends on pharmacies keeping listings current.

---

## 14. Future Work

- Integration with real DGDA license verification and regulatory reporting
- Real payment gateway and delivery-logistics integration
- Expansion of the medicine database toward national coverage
- Stronger clinical-safety tooling and pharmacist review workflows
- Mobile application

---

## 15. Indicative Timeline (12 Weeks)

| Weeks | Phase |
|-------|-------|
| 1–2 | Requirement analysis, system design, database design |
| 3–4 | Laravel API, authentication, and role setup |
| 5–6 | Marketplace, medicine catalogue, and search |
| 7–8 | Prescription bridge and ordering |
| 9–10 | AI caution layer and admin dashboards |
| 11 | Testing and bug fixing |
| 12 | Documentation and final presentation |

---

## 16. Conclusion

MediReach is a forward-looking academic prototype that designs the digital future of medicine access in Bangladesh: making rare medicines reachable, linking doctors' prescriptions to purchases, and adding an AI layer that informs and cautions without ever overriding a doctor. It combines a genuine social problem with a clear, safe, and technically sound design — built on Laravel, Next.js, Tailwind, shadcn/ui, and MySQL.

---

## References

1. Directorate General of Drug Administration (DGDA), Bangladesh — regulatory authority for medicine under the Drugs Act 1940 and the Drugs (Control) Ordinance 1982.
2. Drugs and Cosmetics Act 2023, Bangladesh.
3. DGDA — Standard Operating Procedure (SOP) for Online Pharmacy.
4. DGDA — Guideline on the Regulation of Artificial Intelligence and Medical Robotics in Healthcare, Bangladesh.
5. National Artificial Intelligence Policy 2024, Bangladesh.
6. The Business Standard — analysis of Bangladesh's online pharmacy market (online pharmacies holding under one percent of market share).
7. Pharmacy Council of Bangladesh — pharmacist licensing requirements.
