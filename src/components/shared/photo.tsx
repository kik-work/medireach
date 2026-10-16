import Image from "next/image";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** Dark gradient so overlaid text stays readable. */
  overlay?: boolean;
}

/** Rounded, responsive photo that fills its (relative) parent box. */
export function Photo({ src, alt, className, priority, sizes = "(min-width: 1024px) 50vw, 100vw", overlay }: Props) {
  return (
    <>
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={cn("object-cover", className)} />
      {overlay && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />}
    </>
  );
}
