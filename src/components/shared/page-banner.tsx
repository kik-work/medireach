import type { ReactNode } from "react";
import { Photo } from "@/components/shared/photo";

/** Photo banner for top of listing pages. */
export function PageBanner({ title, description, image, children }: { title: string; description?: string; image: string; children?: ReactNode }) {
  return (
    <section className="relative mb-8 overflow-hidden rounded-3xl">
      <Photo src={image} alt="" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/20" />
      <div className="relative space-y-3 px-6 py-12 text-white md:px-12 lg:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        {description && <p className="max-w-xl text-white/85">{description}</p>}
        {children}
      </div>
    </section>
  );
}
