import Link from "next/link";
import {
  Activity, ArrowRight, Bug, Building2, Check, ChevronDown, ClipboardCheck, Droplets, FileText, Flower2, HeartPulse,
  Lock, MapPin, Pill, Search, ShieldCheck, ShoppingCart, Sparkles, Stethoscope, Store, Truck, User, Brain, AlertOctagon, Copy,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MedicineCard } from "@/components/medicine/medicine-card";
import { CountUp } from "@/components/shared/count-up";
import { Photo } from "@/components/shared/photo";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";
import { AI_DISCLAIMER, CITIES, formatBDT } from "@/lib/constants";
import { IMAGES } from "@/lib/images";
import { getPlatformStats } from "@/lib/services/admin.service";
import { buildCautionReport } from "@/lib/services/caution.service";
import { getMedicineById, listCategories, listMedicines } from "@/lib/services/medicine.service";
import { listPharmacies } from "@/lib/services/pharmacy.service";
import { cn } from "@/lib/utils";

const steps = [
  { icon: Search, title: "Search", text: "Type a brand, generic name or condition. Results update with price and stock." },
  { icon: MapPin, title: "Locate", text: "See which pharmacies hold it — your city first, then the rest of the country." },
  { icon: ClipboardCheck, title: "Verify", text: "Rx-only medicines are checked against your doctor's prescription." },
  { icon: Truck, title: "Receive", text: "Order from the pharmacy and follow the status until it reaches you." },
];

const layers = [
  { icon: MapPin, title: "Marketplace", text: "Pharmacies list stock and price. Rare medicines become discoverable across the country.", points: ["Live stock by pharmacy", "Nearby first, then national"] },
  { icon: FileText, title: "Prescription bridge", text: "Doctors issue digital prescriptions that unlock the medicines they prescribed.", points: ["Rx-only gating at checkout", "Validity dates on every prescription"] },
  { icon: Sparkles, title: "AI caution layer", text: "Cautions, interactions and duplicate-ingredient alerts from a curated database.", points: ["Retrieval, not free generation", "The AI informs; the doctor decides"] },
  { icon: ShieldCheck, title: "Roles & trust", text: "Patient, doctor, pharmacist and admin — each with their own dashboard.", points: ["Admin-verified doctors and pharmacies", "Suspend bad actors instantly"] },
];

const categoryIcons: Record<string, LucideIcon> = {
  Allergy: Flower2,
  Antibiotics: Bug,
  "Blood Thinners": Droplets,
  Diabetes: Activity,
  "Heart & Blood Pressure": HeartPulse,
  Neurology: Brain,
  Transplant: ShieldCheck,
};

const audiences = [
  { icon: User, label: "Patients", text: "Find medicine, understand it, and get it delivered.", points: ["Search nationwide stock", "See cautions before you pay", "Keep every prescription in one place"], href: "/login?role=patient", cta: "Continue as patient" },
  { icon: Stethoscope, label: "Doctors", text: "Prescribe digitally and link it to purchases.", points: ["Searchable medicine database", "Prescriptions with validity dates", "Full issued history"], href: "/login?role=doctor", cta: "Continue as doctor" },
  { icon: Store, label: "Pharmacists", text: "Reach patients who can't find stock elsewhere.", points: ["Manage stock and prices", "Confirm, pack and deliver orders", "Rare-medicine visibility"], href: "/login?role=pharmacist", cta: "Continue as pharmacist" },
];

const faqs = [
  ["Can I buy any medicine without a prescription?", "Only over-the-counter medicines. Rx-only medicines are blocked at checkout until a valid prescription from a verified doctor is on your account."],
  ["Does the AI tell me what to take?", "No. It never starts a treatment decision. It only annotates medicines a licensed doctor already chose, using facts from a curated database."],
  ["How do I find a rare medicine?", "Search for it. Every pharmacy in the country that holds stock is listed, with your city shown first."],
  ["Who verifies doctors and pharmacies?", "The admin team reviews every registration before it can issue prescriptions or list stock."],
];

const SEVERITY_STYLE: Record<string, string> = {
  major: "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
  moderate: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  minor: "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
};

export default function HomePage() {
  const rare = listMedicines({ rareOnly: true });
  const all = listMedicines();
  const stats = getPlatformStats();
  const categories = listCategories();
  const verified = listPharmacies().filter((p) => p.status === "verified");

  const exampleIds = ["m01", "m02", "m12", "m10"];
  const example = buildCautionReport(exampleIds);
  const exampleMeds = exampleIds.map((id) => getMedicineById(id)!);

  return (
    <div className="space-y-28 lg:space-y-40">
      {/* Hero */}
      <section className="relative grid items-center gap-12 pt-4 md:grid-cols-2 lg:gap-20">
        <div className="pointer-events-none absolute -top-24 -left-24 -z-10 size-96 animate-blob rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute right-0 -bottom-10 -z-10 size-80 animate-blob rounded-full bg-violet-400/10 blur-3xl [animation-delay:-6s]" />

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Badge variant="outline" className="gap-1.5 py-3 pr-3 pl-2.5">
            <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-primary" /></span>
            Digital medicine access · Bangladesh
          </Badge>
          <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            Find the medicine <span className="bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">no shop nearby</span> keeps.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            A nationwide inventory for rare drugs, prescriptions linked to purchases, and an AI layer that cautions but never prescribes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/medicines" className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-base shadow-lg shadow-primary/25 transition hover:-translate-y-0.5")}>Search medicines <ArrowRight /></Link>
            <Link href="/how-it-works" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-11 px-5 text-base")}>How it works</Link>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
            {["Verified pharmacies", "Prescription-checked", "Interaction alerts"].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Check className="size-4 text-primary" />{t}</li>
            ))}
          </ul>
        </div>

        <div className="relative animate-in fade-in zoom-in-95 duration-1000">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5">
            <Photo src={IMAGES.hero} alt="Assorted medicine blister packs" priority sizes="(min-width: 768px) 50vw, 100vw" className="transition duration-700 hover:scale-105" />
          </div>
          <div className="absolute -bottom-8 left-4 right-4 animate-float rounded-2xl border bg-card/95 p-5 shadow-xl backdrop-blur sm:left-auto sm:w-[26rem]">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                [stats.medicines, "Medicines"],
                [stats.rareMedicines, "Rare drugs"],
                [stats.pharmacies, "Pharmacies"],
              ].map(([n, label]) => (
                <div key={label}>
                  <p className="text-3xl font-extrabold text-primary"><CountUp to={n as number} /></p>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section>
        <Reveal>
          <SectionHeading eyebrow="How it works" title="From search to doorstep in four steps" description="Safety checks are built into every step." />
        </Reveal>
        <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div className="absolute top-8 right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent lg:block" />
          {steps.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 120} className="relative text-center">
              <div className="relative mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:rotate-6 hover:scale-110">
                <Icon className="size-7" />
                <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border-2 border-background bg-foreground text-xs font-bold text-background">{i + 1}</span>
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mx-auto mt-2 max-w-60 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Rare medicines */}
      <section>
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow="Rare medicines"
            title="Hard-to-find, now discoverable"
            description="Stocked by only a handful of pharmacies. Each card shows where it is available and the lowest price."
            action={<Link href="/medicines?rare=1" className={buttonVariants({ variant: "outline" })}>See all rare medicines <ArrowRight /></Link>}
          />
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {rare.map((m, i) => (
            <Reveal key={m.id} delay={i * 90}><MedicineCard medicine={m} /></Reveal>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <Reveal>
          <SectionHeading eyebrow="Catalogue" title="Browse by category" description={`${all.length} medicines across ${categories.length} categories.`} />
        </Reveal>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((c, i) => {
            const Icon = categoryIcons[c] ?? Pill;
            const count = all.filter((m) => m.category === c).length;
            return (
              <Reveal key={c} delay={(i % 5) * 70}>
                <Link href={`/medicines?category=${encodeURIComponent(c)}`}
                  className="group flex h-full items-center gap-3 rounded-2xl border bg-card p-4 transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{c}</span>
                    <span className="text-xs text-muted-foreground">{count} medicine{count === 1 ? "" : "s"}</span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* AI caution spotlight */}
      <section className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <Reveal className="space-y-5">
          <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">AI caution layer</p>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Brand names confuse. Ingredients don&apos;t.</h2>
          <p className="text-lg text-muted-foreground">
            Many brands share one active ingredient. MediReach spots duplicates and interactions before you pay, using facts retrieved from a curated medicine database — never invented by a model.
          </p>
          <ul className="space-y-2.5 text-sm font-medium">
            {["Duplicate-ingredient alerts across brands", "Interaction warnings ranked by severity", "Rx-only items flagged before checkout"].map((t) => (
              <li key={t} className="flex items-center gap-2.5"><span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary"><Check className="size-3" /></span>{t}</li>
            ))}
          </ul>
          <p className="rounded-xl bg-muted px-4 py-3 text-sm font-semibold">{AI_DISCLAIMER}</p>
        </Reveal>

        <Reveal delay={150}>
          <div className="overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-primary/10">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-5 py-3 text-sm font-semibold"><ShoppingCart className="size-4 text-primary" /> Example cart</div>
            <ul className="divide-y px-5 text-sm">
              {exampleMeds.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2.5">
                  <span className="font-medium">{m.brand} <span className="font-normal text-muted-foreground">{m.strength} · {m.generic}</span></span>
                  <span className="font-semibold">{formatBDT(m.price)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-2.5 border-t bg-muted/30 p-5 text-sm">
              <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-primary uppercase"><Sparkles className="size-3.5" /> AI caution</p>
              {example.duplicates.map((d) => (
                <div key={d.ingredient} className="flex gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  <Copy className="mt-0.5 size-4 shrink-0" />
                  <p><b>Duplicate:</b> {d.brands.join(" + ")} both contain <b className="capitalize">{d.ingredient}</b>.</p>
                </div>
              ))}
              {example.interactions.slice(0, 2).map((i) => (
                <div key={i.pair.join()} className={cn("flex gap-3 rounded-xl border p-3", SEVERITY_STYLE[i.severity])}>
                  <AlertOctagon className="mt-0.5 size-4 shrink-0" />
                  <p><b className="capitalize">{i.severity}:</b> {i.brands.join(" + ")}. {i.message}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Coverage */}
      <section className="relative overflow-hidden rounded-3xl">
        <Photo src={IMAGES.pharmacy} alt="Inside a modern pharmacy" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/30" />
        <div className="relative space-y-10 px-6 py-16 text-white md:px-14 lg:py-24">
          <Reveal className="max-w-xl space-y-3">
            <p className="text-xs font-bold tracking-[0.18em] text-teal-300 uppercase">Coverage</p>
            <h2 className="text-3xl font-extrabold md:text-4xl">Pharmacies across the country</h2>
            <p className="text-white/80">Verified pharmacies in every division we serve, so a rare medicine is never one city away from impossible.</p>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {CITIES.map((c, i) => (
              <Reveal key={c} delay={i * 80}>
                <Link href="/pharmacies" className="group block rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/20">
                  <Building2 className="mb-3 size-6 text-teal-300" />
                  <p className="text-lg font-bold">{c}</p>
                  <p className="text-sm text-white/75">{verified.filter((p) => p.city === c).length} verified pharmacies</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Four layers */}
      <section>
        <Reveal>
          <SectionHeading eyebrow="The system" title="Four layers, one platform" description="Each layer does one job well, and together they keep a licensed human in charge." />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {layers.map(({ icon: Icon, title, text, points }, i) => (
            <Reveal key={title} delay={i * 100}>
              <article className="group relative h-full overflow-hidden rounded-2xl border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
                <span className="absolute top-3 right-4 text-6xl font-black text-muted-foreground/10 transition group-hover:text-primary/15">0{i + 1}</span>
                <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="size-6" /></span>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                <ul className="mt-4 space-y-1.5 border-t pt-4 text-sm">
                  {points.map((p) => <li key={p} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{p}</li>)}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
        <Reveal className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <Badge variant="outline" className="gap-1.5"><Lock className="size-3" /> Safety commitments</Badge>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Safety is a design rule, not a feature.</h2>
          <p className="text-lg text-muted-foreground">Every part of MediReach is built so that a licensed human stays in charge of treatment decisions.</p>
        </Reveal>
        <ul className="grid gap-5 sm:grid-cols-2">
          {[
            [ClipboardCheck, "Prescription gate", "Rx-only medicines cannot be ordered without a valid prescription on file."],
            [ShieldCheck, "Verified supply", "Only admin-verified pharmacies appear in search. Bad actors can be suspended instantly."],
            [FileText, "Curated knowledge", "Cautions come from a maintained medicine database, never from free-form AI generation."],
            [Stethoscope, "Doctor decides", "The AI never recommends a drug or a dose. It annotates what your doctor already chose."],
          ].map(([Icon, t, d], i) => {
            const I = Icon as LucideIcon;
            return (
              <Reveal key={t as string} delay={i * 100}>
                <li className="h-full rounded-2xl border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><I className="size-5" /></span>
                  <p className="text-lg font-bold">{t as string}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d as string}</p>
                </li>
              </Reveal>
            );
          })}
        </ul>
      </section>

      {/* Audiences */}
      <section>
        <Reveal>
          <SectionHeading eyebrow="Who it's for" title="Built for everyone in the chain" description="Pick a role to see its dashboard." />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {audiences.map(({ icon: Icon, label, text, points, href, cta }, i) => (
            <Reveal key={label} delay={i * 110}>
              <article className="group flex h-full flex-col rounded-2xl border bg-card p-7 transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
                <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition group-hover:rotate-6"><Icon className="size-7" /></span>
                <h3 className="text-xl font-bold">{label}</h3>
                <p className="mt-1.5 text-muted-foreground">{text}</p>
                <ul className="my-5 flex-1 space-y-2 text-sm">
                  {points.map((p) => <li key={p} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{p}</li>)}
                </ul>
                <Link href={href} className={cn(buttonVariants({ variant: "outline" }), "w-full group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground")}>{cta} <ArrowRight /></Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Doctors spotlight */}
      <section className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5">
            <Photo src={IMAGES.doctor} alt="Doctor using a phone" className="transition duration-700 hover:scale-105" />
          </div>
        </Reveal>
        <Reveal delay={120} className="space-y-5">
          <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">For doctors</p>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Prescribe digitally. Never lose a prescription again.</h2>
          <p className="text-lg text-muted-foreground">Issue prescriptions in seconds. Each one is linked to the patient&apos;s account, so prescribed medicines become purchasable — and Rx-only drugs stay protected.</p>
          <ul className="space-y-2.5 text-sm font-medium">
            {["Searchable medicine database", "Validity dates on every prescription", "Full history of what you issued"].map((t) => (
              <li key={t} className="flex items-center gap-2.5"><span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary"><Check className="size-3" /></span>{t}</li>
            ))}
          </ul>
          <Link href="/login?role=doctor" className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-base")}>Doctor access <ArrowRight /></Link>
        </Reveal>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto w-full max-w-3xl">
        <Reveal><SectionHeading eyebrow="FAQ" title="Frequently asked questions" /></Reveal>
        <Reveal>
          <div className="divide-y overflow-hidden rounded-2xl border bg-card">
            {faqs.map(([q, a]) => (
              <details key={q} className="group px-6 py-5 open:bg-muted/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold">
                  {q}
                  <ChevronDown className="size-5 shrink-0 text-muted-foreground transition duration-300 group-open:rotate-180 group-open:text-primary" />
                </summary>
                <p className="mt-3 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <Reveal>
        <section className="relative isolate overflow-hidden rounded-3xl px-6 py-20 text-center text-white md:px-12 lg:py-28">
          <Photo src={IMAGES.blister} alt="" sizes="100vw" className="transition duration-[1500ms] hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-teal-900/90" />
          <div className="pointer-events-none absolute -top-20 -right-20 size-72 animate-blob rounded-full bg-white/10 blur-3xl" />
          <div className="relative space-y-6">
            <h2 className="mx-auto max-w-3xl text-3xl font-extrabold md:text-5xl">Need a medicine you can&apos;t find nearby?</h2>
            <p className="mx-auto max-w-xl text-lg text-white/90">Search the nationwide inventory now — it takes a few seconds.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/medicines" className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "h-12 px-6 text-base shadow-xl transition hover:-translate-y-0.5")}>
                <Search /> Start searching
              </Link>
              <Link href="/pharmacies" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 border-white/50 bg-transparent px-6 text-base text-white hover:bg-white/15 hover:text-white")}>
                Browse pharmacies
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
