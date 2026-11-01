import { Footer } from "./footer";
import { SiteChrome } from "./header";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteChrome />
      {children}
      <Footer />
    </>
  );
}
