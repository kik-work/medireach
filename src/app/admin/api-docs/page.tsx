import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

const endpoints = [
  { method: "POST", path: "/api/auth/login", desc: "Body { identifier, password, scope? }. Sets the session cookie", access: "public" },
  { method: "POST", path: "/api/auth/signup", desc: "Patient, doctor or pharmacist. Doctors and pharmacists start pending", access: "public" },
  { method: "POST", path: "/api/auth/logout", desc: "End the session. GET /api/auth/me returns the current user", access: "public" },
  { method: "GET", path: "/api/medicines", desc: "Search catalogue. Query: q, category, rx=rx|otc, rare=1", access: "public" },
  { method: "GET", path: "/api/medicines/:slug", desc: "Single medicine", access: "public" },
  { method: "GET", path: "/api/medicines/:slug/availability", desc: "Stock by pharmacy. Query: city. Returns { nearby, national }", access: "public" },
  { method: "GET", path: "/api/pharmacies", desc: "Verified pharmacies. Query: city", access: "public" },
  { method: "POST", path: "/api/caution", desc: "Body { medicineIds[] } → duplicates, interactions, cautions, Rx list. A signed-in patient's prescriptions, active refills and orders of the last 30 days are checked too (report.profile)", access: "public" },
  { method: "POST", path: "/api/caution/summary", desc: "Body { medicineIds[], withProfile? } → { text, model } or null. Plain-language phrasing of the same report by Claude; off unless ANTHROPIC_API_KEY is set. 20 per minute", access: "public" },
  { method: "GET", path: "/api/dashboard", desc: "Role-filtered data for the signed-in user's dashboard", access: "any role" },
  { method: "POST", path: "/api/prescriptions", desc: "Doctor issues (verified only). Patient uploads a copy. GET lists own", access: "doctor, patient" },
  { method: "PATCH", path: "/api/prescriptions/:id", desc: "Doctor edits own prescription. DELETE: doctor revokes, patient removes own upload", access: "doctor, patient" },
  { method: "POST", path: "/api/doctors/suggest", desc: "Body { query } → matching specialties with cautions and every verified doctor of each (AI doctor finder, no diagnosis)", access: "public" },
  { method: "PATCH", path: "/api/doctors/me", desc: "Create or update the doctor's practice profile: specialty, fee, conditions treated, accepting (on leave)", access: "doctor" },
  { method: "POST", path: "/api/appointments", desc: "Body { doctorId, date, time, mode: video|chat, reason }. Taken or off-day slots → 409. GET lists own", access: "patient" },
  { method: "GET", path: "/api/appointments/:id", desc: "Consultation room: appointment, chat, reports, linked prescriptions. The room polls it", access: "doctor, patient" },
  { method: "PATCH", path: "/api/appointments/:id", desc: "Body { action }. Doctor: approve, decline, reschedule {date, time, note}, complete. Patient: cancel. Both: start-call, end-call", access: "doctor, patient" },
  { method: "POST", path: "/api/appointments/:id/messages", desc: "Body { text }. Chat is open while the appointment is approved or rescheduled", access: "doctor, patient" },
  { method: "POST", path: "/api/appointments/:id/reports", desc: "Body { fileName, fileData (data URL: JPEG, PNG, WebP or PDF, max 3 MB), note? } attaches a test report. DELETE /api/appointments/:id/reports/:reportId removes it and its file", access: "patient" },
  { method: "GET", path: "/api/appointments/:id/reports/:reportId", desc: "The stored report file", access: "doctor, patient" },
  { method: "POST", path: "/api/orders", desc: "Body { lines[{medicineId, pharmacyId, quantity}], payment?: { method: cod|bkash|card, account?, expiry? } }. Rx without valid prescription → 422. Out of stock → pre-order. Payment is simulated; declined → 422", access: "patient" },
  { method: "PATCH", path: "/api/orders/:id", desc: "Body { status }. Pharmacist: next step or cancel. Patient: cancel early. Admin: cancel. Delivered marks cash paid; cancelled refunds a prepaid order", access: "pharmacist, patient, admin" },
  { method: "POST", path: "/api/stock", desc: "Body { medicineId, quantity, price } upserts a listing. DELETE /api/stock/:medicineId removes it", access: "pharmacist" },
  { method: "PATCH", path: "/api/pharmacies/:id", desc: "Edit details and location (owner). Set verification status (admin)", access: "pharmacist, admin" },
  { method: "GET", path: "/api/refills", desc: "Refill subscriptions (places due auto-orders first). POST create, PATCH/DELETE /api/refills/:id (PATCH { autoOrder } switches automatic ordering), POST /api/refills/:id/order", access: "patient" },
  { method: "POST", path: "/api/medicines", desc: "Add a medicine. It stays hidden until a verified doctor approves it. PATCH/DELETE /api/medicines/:slugOrId edit or remove it (admin only; a pharmacist can PATCH only their own rejected proposal to send it again)", access: "admin, pharmacist" },
  { method: "PATCH", path: "/api/users/:id", desc: "Body { status }: verify, reject, suspend or reinstate", access: "admin" },
  { method: "GET", path: "/api/admin/stats", desc: "Platform counters", access: "localhost" },
];

export default function ApiDocs() {
  return (
    <>
      <PageHeader
        title="API reference"
        description="Route handlers under src/app/api, backed by services in src/lib/services. Data is saved on the server in .data/db.json, created from src/lib/data on first run. Delete the file to reset."
      />
      <Card>
        <CardContent className="divide-y">
          {endpoints.map((e) => (
            <div key={e.method + e.path} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <Badge variant={e.method === "GET" ? "secondary" : "default"} className="w-14 justify-center">{e.method}</Badge>
              <code className="font-mono">{e.path}</code>
              <span className="min-w-60 flex-1 text-muted-foreground">{e.desc}</span>
              <Badge variant="outline">{e.access}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
