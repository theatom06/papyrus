import { Footer } from "./footer";
import { SiteChrome } from "./site-chrome";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteChrome />
      {children}
      <Footer />
    </>
  );
}
