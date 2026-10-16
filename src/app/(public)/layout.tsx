import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CONTAINER } from "@/lib/constants";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className={`${CONTAINER} flex-1 py-10 lg:py-14`}>{children}</main>
      <SiteFooter />
    </>
  );
}
