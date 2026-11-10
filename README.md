# MediReach

A prototype web platform that models how buying medicine online in Bangladesh could work once the DGDA formally supports it. Patients find medicines (including rare ones) across pharmacies nationwide, doctors issue digital prescriptions, prescription-only medicines are gated on a valid prescription, and an AI caution layer warns about duplicate ingredients and interactions.

It is an academic prototype, not a live pharmacy. Licence verification, payment and delivery are simulated. The project proposal is in [MediReach_Project_Proposal.md](MediReach_Project_Proposal.md).

## Stack

| Part | Technology |
|---|---|
| Web app and REST API | Next.js 16 (App Router, route handlers), React 19, TypeScript |
| Styling and components | Tailwind CSS 4, shadcn/ui |
| Data | One JSON file (`.data/db.json`), created from seed data on first run |
| AI caution phrasing (optional) | Claude API via `@anthropic-ai/sdk` |
| Tests | Vitest |

The proposal planned a Laravel + MySQL backend. The prototype keeps the same layered design (route handler → service → data) inside Next.js; see [docs/SRS.md](docs/SRS.md#7-architecture) for why, and what a move to Laravel/MySQL would change.

## Run it

Needs Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Open http://localhost:3000. The database file `.data/db.json` is created on first start. Delete the `.data` folder to reset everything to the sample data.

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` then `npm start` | Production build and server |
| `npm test` | Unit tests (Vitest). They use a temporary data folder and never touch `.data/` |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Configuration

Copy [.env.example](.env.example) to `.env.local`. Everything is optional for local use.

| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Signs the session cookie. **Set it for any shared deployment**; a development fallback is used otherwise. |
| `ANTHROPIC_API_KEY` | Turns on the plain-language summary in the AI caution panel. Without it the panel shows the retrieval-based cards only. |
| `CAUTION_MODEL` | Model for that summary. Default `claude-opus-5-5`. |
| `MEDIREACH_DATA_DIR` | Where the JSON database and uploads live. Default `./.data`. |

## Demo accounts

| Role | Login | Password |
|---|---|---|
| Patient | `patient@medireach.com` | `patient123` |
| Doctor (verified) | `doctor@medireach.com` | `doctor123` |
| Pharmacist (verified) | `pharmacist@medireach.com` | `pharmacist123` |
| Admin | `admin@medireach.com` at `/admin` | `admin123` |

Patients and doctors log in at `/login`. The admin logs in at `/admin`.

## Try the main flows

- **Rare medicine search:** open `/medicines`, tick "Rare only", open Warf or Tacrol and share your location or pick a city. Nearby pharmacies are listed first, then the rest of the country.
- **Rx gating:** as the patient, add an Rx-only medicine to the cart without a prescription. Checkout is blocked until a doctor issues one or an admin approves an uploaded copy.
- **AI caution layer:** add Napa and Ace to the cart (both paracetamol), or Warf and Ecosprin (major interaction). Signed in as a patient, the panel also checks against your prescriptions, refills and recent orders.
- **Simulated payment:** at checkout choose bKash (`01712345678`) or card (`4242 4242 4242 4242`, any future expiry). `…0000` bKash numbers and `4000 0000 0000 0002` are declined on purpose.
- **Refills:** subscribe at `/patient/refills` and switch on auto-order to have the order placed on the due date.

## Documentation

| Document | Contents |
|---|---|
| [docs/SRS.md](docs/SRS.md) | Software requirements specification and architecture |
| [docs/ER-DIAGRAM.md](docs/ER-DIAGRAM.md) | Entity-relationship diagram and data dictionary |
| [docs/USE-CASES.md](docs/USE-CASES.md) | Use cases per role and page wireframes |
| [docs/USER-GUIDE.md](docs/USER-GUIDE.md) | How each role uses the platform |
| [docs/REGULATORY-SAFETY.md](docs/REGULATORY-SAFETY.md) | Regulatory and safety requirements for a real deployment |
| `/admin/api-docs` (in the app) | REST API reference |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Folder layout and module notes for developers |
