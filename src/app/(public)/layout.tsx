import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CONTAINER } from "@/lib/constants";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    // overflow-x-clip: decorative animated blobs (hero) drift past the viewport edge;
    // clip (not hidden) so the sticky header keeps working.
    <div className="flex flex-1 flex-col overflow-x-clip">
      <SiteHeader />
      <main className={`${CONTAINER} flex-1 py-10 lg:py-14`}>{children}</main>
      <SiteFooter />
    </div>
  );
}
