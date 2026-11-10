# Regulatory and Safety Analysis — MediReach

This document addresses proposal objective 5: what a real deployment of MediReach would require. The prototype simulates each of these controls; this analysis states what is simulated, what the prototype already enforces, and what a live service would need.

It is a design analysis for an academic project, not legal advice. Before any real launch, the current text of each instrument below must be checked with the DGDA and a lawyer, because rules for online pharmacy and AI in health in Bangladesh are still developing.

## 1. Regulatory landscape

| Instrument / body | Relevance to MediReach |
|---|---|
| Drugs Act 1940; Drugs (Control) Ordinance 1982; Drugs and Cosmetics Act 2023 | Licensing of medicine sale and distribution, prescription-only control, labelling, offences. Every seller on the platform must be a licensed pharmacy. |
| DGDA — SOP for Online Pharmacy | Conditions for selling medicine online: licensed premises, pharmacist oversight, prescription handling, record keeping. The platform must operate inside these conditions. |
| DGDA — Guideline on AI and Medical Robotics in Healthcare | Governs the AI caution layer: transparency, human oversight, accountability, validation. |
| National AI Policy 2024 | Principles of safe, transparent and accountable AI. |
| Bangladesh Medical and Dental Council (BMDC) | Registration of doctors who issue prescriptions. |
| Pharmacy Council of Bangladesh | Registration of pharmacists who dispense. |
| Data protection and digital-security law (current instrument to be confirmed) | Health data is sensitive personal data: consent, purpose limits, security, breach handling, retention. |

## 2. Requirements for a live deployment, and the prototype's status

| # | Requirement | Prototype today | Needed for real deployment |
|---|---|---|---|
| R1 | Only licensed pharmacies sell | Admin verifies each pharmacy; DGDA licence number collected; unverified pharmacies hidden and cannot take orders | Verify licence against the DGDA register (API or documented manual check); periodic re-verification; licence expiry dates |
| R2 | Only registered doctors prescribe | BMDC number collected; admin verification; only verified doctors issue prescriptions | Check against the BMDC register; doctor identity check; digital signature on each prescription |
| R3 | Registered pharmacist responsible for each pharmacy | Pharmacy Council number collected; admin verification; only verified pharmacists change order status or live stock | Check against the Pharmacy Council register; named responsible pharmacist per pharmacy |
| R4 | Rx medicines only against a valid prescription | Enforced on the server for cart, "order now" and automatic refills; 30-day validity; uploaded copies need admin approval | Pharmacist review of every Rx order before dispensing; mark prescriptions as used (quantity dispensed) to stop reuse at several pharmacies; QR code or e-prescription ID; controlled-drug rules |
| R5 | Prescription integrity | Upload type and size checked by content; file served only to patient, admin, and pharmacies with an order from that patient | Tamper evidence (signed e-prescriptions), audit log of who viewed what |
| R6 | Product quality | Curated catalogue; every new medicine reviewed by a verified doctor before going live | Link catalogue to the DGDA registered-product list; batch numbers and expiry dates per stock item; recalls; cold-chain flags |
| R7 | Record keeping | Orders, prescriptions and status changes stored | Immutable dispensing records kept for the legally required period; reports to the DGDA on request |
| R8 | Payment | Simulated; no card or wallet numbers stored (last 4 digits only) | Licensed payment gateway (e.g. bKash, SSLCommerz) with PCI-DSS scope kept at the gateway; refunds and reconciliation |
| R9 | Delivery | Not implemented | Licensed delivery partners; identity check on receipt for Rx items; temperature control; delivery-area limits |
| R10 | Data protection | Salted password hashes; signed HTTP-only session cookies; role checks on every API route; patients see only their own data | Encryption at rest; access logs; consent and privacy notice; retention and deletion policy; breach procedure; data hosted per local rules |
| R11 | Accountability for AI | See section 3 | Validation study; incident reporting; named clinical safety officer |

## 3. Safety design of the AI caution layer

### 3.1 Principle

**The AI informs; the doctor decides.** The layer never starts, stops or changes a treatment. It only annotates a decision a licensed doctor or pharmacist already made.

### 3.2 Hazards and controls

| Hazard | Control in the prototype |
|---|---|
| Invented doses or facts (hallucination) | Facts are retrieved from the curated medicine and interaction tables only. The optional language model receives only that retrieved report, is told to add no facts, doses or advice, and the disclaimer is appended by code, not by the model. The full retrieved cards are always shown beneath any summary. |
| Missed interaction or duplicate | Duplicate active ingredients are found by comparing ingredient lists across all checked brands. Interactions come from a curated table. For signed-in patients the check also covers their current prescriptions, active refills and recent orders. |
| Unreviewed medicine data | A medicine and its cautions are invisible to everyone, including the AI layer, until a verified doctor approves them. Changing safety-relevant fields sends it back to review. |
| User treats output as medical advice | Every output ends with "This is general information. Follow your doctor's instructions." The doctor finder suggests a kind of doctor and never names a condition as a diagnosis. |
| Model unavailable or wrong | The model step is optional and fails closed: on any error or refusal, the page shows the retrieval cards alone. |
| Cost or abuse of the model endpoint | Rate limited (20 calls per minute per user or address); identical reports are cached. |

### 3.3 Known limitations

- The curated tables cover a small demonstration set. "No interaction found" means none is recorded in the database, not that none exists. The panel wording says so.
- Profile checks see only data on MediReach. Medicines bought elsewhere are invisible.
- Interactions are pairwise and by ingredient; dose, duration, kidney or liver function, pregnancy and allergies are not modelled.
- The language-model wording has not been evaluated with patients. A live service would need a validation study (accuracy, omissions, readability in Bangla and English) under the DGDA AI guideline.

## 4. Recommendations before any pilot

1. Agree the operating model with the DGDA under the online pharmacy SOP, and connect licence checks to official registers (R1–R3).
2. Add pharmacist review of every Rx order and single-use, signed e-prescriptions (R4, R5).
3. Link the catalogue to the DGDA product register, with batch and expiry tracking (R6).
4. Commission a clinical review of the curated tables, and an evaluation of the AI wording, before showing it to patients (section 3).
5. Complete a data-protection impact assessment and add audit logging (R10).
6. Integrate a licensed payment gateway and delivery partner in their sandboxes first (R8, R9).
