import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  action?: ReactNode;
}

/** Consistent section header: small label, big title, short description. */
export function SectionHeading({ eyebrow, title, description, align = "center", action }: Props) {
  return (
    <div className={cn("mb-10 flex flex-wrap items-end justify-between gap-4", align === "center" && "flex-col items-center text-center")}>
      <div className={cn("max-w-2xl space-y-3", align === "center" && "mx-auto")}>
        {eyebrow && <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">{eyebrow}</p>}
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h2>
        {description && <p className="text-base text-muted-foreground md:text-lg">{description}</p>}
      </div>
      {action}
    </div>
  );
}
