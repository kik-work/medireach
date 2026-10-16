import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

const endpoints = [
  { method: "GET", path: "/api/medicines", desc: "Search catalogue. Query: q, category, rx=rx|otc, rare=1", access: "public" },
  { method: "GET", path: "/api/medicines/:slug", desc: "Single medicine", access: "public" },
  { method: "GET", path: "/api/medicines/:slug/availability", desc: "Stock by pharmacy. Query: city. Returns { nearby, national }", access: "public" },
  { method: "GET", path: "/api/pharmacies", desc: "Verified pharmacies. Query: city", access: "public" },
  { method: "POST", path: "/api/caution", desc: "Body { medicineIds[] } → duplicates, interactions, cautions, Rx list", access: "public" },
  { method: "GET", path: "/api/orders", desc: "Orders of the logged-in patient", access: "patient" },
  { method: "POST", path: "/api/orders", desc: "Body { lines[{medicineId, pharmacyId, quantity}] }. Rejects Rx items without a valid prescription (422)", access: "patient" },
  { method: "GET", path: "/api/admin/stats", desc: "Platform counters", access: "localhost" },
];

export default function ApiDocs() {
  return (
    <>
      <PageHeader title="API reference" description="Route handlers under src/app/api. Backed by services in src/lib/services and data in src/lib/data." />
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
