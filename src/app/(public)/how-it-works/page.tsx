import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { AI_DISCLAIMER } from "@/lib/constants";

export const metadata = { title: "How it works" };

const steps = [
  ["Search", "Find a medicine by brand, generic name or condition. Rare medicines show every pharmacy in the country that holds stock."],
  ["Prescription check", "Rx-only medicines can be added to the cart, but checkout needs a valid prescription issued by a verified doctor."],
  ["AI caution", "Before you order, the caution layer lists cautions, interactions between cart items, and duplicate ingredients (e.g. Napa + Ace = paracetamol twice)."],
  ["Order", "Orders are split per pharmacy. Pay on delivery and track each order from your dashboard."],
  ["Pharmacy fulfils", "The pharmacist confirms, packs and delivers; the status updates on your dashboard."],
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="How MediReach works" description="From search to delivery, with safety checks built in." />
      <ol className="space-y-3">
        {steps.map(([title, text], i) => (
          <Card key={title}>
            <CardHeader><CardTitle className="flex items-center gap-3"><span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">{i + 1}</span>{title}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{text}</CardContent>
          </Card>
        ))}
      </ol>
      <Card className="mt-6 border-primary/40">
        <CardHeader><CardTitle>Design principle: the AI informs, the doctor decides</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>The caution layer never starts a treatment decision. It only annotates a decision a licensed human already made. Facts are retrieved from a curated medicine database (retrieval, not free generation) to avoid invented doses or missed interactions.</p>
          <p className="font-medium text-foreground">{AI_DISCLAIMER}</p>
        </CardContent>
      </Card>
    </div>
  );
}
