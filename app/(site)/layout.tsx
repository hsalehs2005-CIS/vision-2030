import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main className="pt-[76px]">{children}</main>
      <SiteFooter />
    </>
  );
}
