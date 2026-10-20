"use client";

import { Button } from "@/components/ui/button";

const providers = [
  { name: "Google", mark: "G" },
  { name: "Facebook", mark: "f" },
  { name: "Apple", mark: "A" },
  { name: "GitHub", mark: "GH" },
];

/** Placeholder providers: clicking does nothing by design. */
export function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {providers.map((p) => (
        <Button key={p.name} type="button" variant="outline" className="h-10 gap-2" onClick={() => {}}>
          <span aria-hidden className="w-5 text-sm font-bold">{p.mark}</span>
          {p.name}
        </Button>
      ))}
    </div>
  );
}
