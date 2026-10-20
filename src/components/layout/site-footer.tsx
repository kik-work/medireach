import Link from "next/link";
import { Mail, MapPin, Phone, Pill } from "lucide-react";
import { APP_NAME, AI_DISCLAIMER, CITIES, CONTAINER } from "@/lib/constants";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/medicines", label: "Medicine catalogue" },
      { href: "/medicines?rare=1", label: "Rare medicines" },
      { href: "/pharmacies", label: "Verified pharmacies" },
      { href: "/cart", label: "Cart" },
    ],
  },
  {
    title: "For professionals",
    links: [
      { href: "/login?role=doctor", label: "Doctor access" },
      { href: "/login?role=patient", label: "Patient access" },
      { href: "/signup", label: "Create an account" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/#safety", label: "Safety commitments" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-muted/40">
      <div className={`${CONTAINER} grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr]`}>
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Pill className="size-4" /></span>
            {APP_NAME}
          </Link>
          <p className="max-w-xs text-sm text-muted-foreground">
            Safer, wider access to medicine across Bangladesh — rare drugs made discoverable, prescriptions linked to purchases.
          </p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} className="space-y-3 text-sm">
            <p className="font-semibold">{col.title}</p>
            <ul className="space-y-2 text-muted-foreground">
              {col.links.map((l) => (
                <li key={l.href}><Link href={l.href} className="hover:text-foreground">{l.label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="space-y-3 text-sm">
          <p className="font-semibold">Contact</p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="size-4" />support@medireach.com.bd</li>
            <li className="flex items-center gap-2"><Phone className="size-4" />09611-000000</li>
            <li className="flex items-center gap-2"><MapPin className="size-4" />Dhaka, Bangladesh</li>
          </ul>
          <p className="pt-1 text-xs text-muted-foreground">Serving {CITIES.join(", ")}</p>
        </div>
      </div>

      <div className="border-t">
        <div className={`${CONTAINER} flex flex-col gap-2 py-5 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between`}>
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved. Photos via <a href="https://unsplash.com" className="underline hover:text-foreground" target="_blank" rel="noreferrer">Unsplash</a>.</p>
          <p>{AI_DISCLAIMER} Always consult a licensed doctor or pharmacist.</p>
        </div>
      </div>
    </footer>
  );
}
