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
  { method: "POST", path: "/api/caution", desc: "Body { medicineIds[] } → duplicates, interactions, cautions, Rx list", access: "public" },
  { method: "GET", path: "/api/dashboard", desc: "Role-filtered data for the signed-in user's dashboard", access: "any role" },
  { method: "POST", path: "/api/prescriptions", desc: "Doctor issues (verified only). Patient uploads a copy. GET lists own", access: "doctor, patient" },
  { method: "PATCH", path: "/api/prescriptions/:id", desc: "Doctor edits own prescription. DELETE: doctor revokes, patient removes own upload", access: "doctor, patient" },
  { method: "POST", path: "/api/orders", desc: "Body { lines[{medicineId, pharmacyId, quantity}] }. Rx without valid prescription → 422. Out of stock → pre-order", access: "patient" },
  { method: "PATCH", path: "/api/orders/:id", desc: "Body { status }. Pharmacist: next step or cancel. Patient: cancel early. Admin: cancel", access: "pharmacist, patient, admin" },
  { method: "POST", path: "/api/stock", desc: "Body { medicineId, quantity, price } upserts a listing. DELETE /api/stock/:medicineId removes it", access: "pharmacist" },
  { method: "PATCH", path: "/api/pharmacies/:id", desc: "Edit details and location (owner). Set verification status (admin)", access: "pharmacist, admin" },
  { method: "GET", path: "/api/refills", desc: "Refill subscriptions. POST create, PATCH/DELETE /api/refills/:id, POST /api/refills/:id/order", access: "patient" },
  { method: "POST", path: "/api/medicines", desc: "Add a medicine. PATCH/DELETE /api/medicines/:slugOrId edit or remove it", access: "admin" },
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
