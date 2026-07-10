import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Truck, Sparkles } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppFloat from "./WhatsAppFloat";
import PopupBanner from "./PopupBanner";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function AnnouncementBar() {
  return (
    <div className="bg-amber-800 text-amber-50 text-xs tracking-widest text-center py-2 px-4">
      <span className="inline-flex items-center justify-center gap-3">
        <Sparkles className="h-3 w-3 shrink-0 opacity-70" />
        <Truck className="h-3.5 w-3.5 shrink-0" />
        ENVÍO GRATIS A TODO EL PERÚ EN COMPRAS SUPERIORES A S/ 299.00
        <Truck className="h-3.5 w-3.5 shrink-0" />
        <Sparkles className="h-3 w-3 shrink-0 opacity-70" />
      </span>
    </div>
  );
}

export default function Layout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
      <PopupBanner />
    </div>
  );
}
