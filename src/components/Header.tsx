import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn, Menu, Lock, User, X, LogOut, LayoutDashboard, Settings2 } from "lucide-react";
import { useUi } from "../lib/ui";
import { LogoMark } from "./ui/Ornament";
import { cn } from "../utils/cn";

const NAV = [{ label: "Beranda", href: "#beranda" }, { label: "Tema", href: "#tema" }, { label: "Fitur", href: "#fitur" }, { label: "Harga", href: "#harga" }, { label: "Demo", href: "#tema" }];

export function Header() {
  const { openLogin, openRegister, user, isAdmin, toast, openAdmin, openSettings, view, logout } = useUi();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("#beranda");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 16); onScroll(); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  useEffect(() => {
    if (view !== "landing") return;
    const sections = NAV.map((n) => document.querySelector(n.href)).filter(Boolean);
    const obs = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) setActive(`#${e.target.id}`); }); }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach((s) => obs.observe(s as Element));
    return () => obs.disconnect();
  }, [view]);

  const handleSignOut = async () => { await logout(); toast("Anda telah keluar."); };

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-500", scrolled ? "bg-surface/85 shadow-[0_1px_8px_rgba(45,67,58,0.05),0_12px_32px_-16px_rgba(45,67,58,0.18)] backdrop-blur-xl" : "bg-transparent")}>
      <div className="mx-auto flex h-20 max-w-[1360px] items-center justify-between gap-2 px-4 sm:px-5 md:px-8">
        <button type="button" onClick={() => window.location.hash = ''} className="group flex min-w-0 items-center gap-2 text-left sm:gap-2.5">
          <LogoMark className="h-8 w-8 shrink-0 transition-transform duration-500 group-hover:rotate-6 sm:h-9 sm:w-9" />
          <span className="flex min-w-0 flex-col"><span className="truncate font-headline text-[18px] leading-5 tracking-tight text-primary sm:text-[22px] sm:leading-6">Skatim Invitation</span><span className="-mt-0.5 hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-secondary sm:block">Digital Invitation Platform</span></span>
        </button>
        {view === "landing" && <nav className="hidden items-center gap-7 lg:flex">{NAV.map((item) => (<a key={item.href} href={item.href} className={cn("relative text-[13.5px] font-medium tracking-wide transition-colors", active === item.href ? "font-bold text-primary" : "text-on-surface-variant hover:text-on-surface")}>{item.label}<span className={cn("absolute -bottom-2 left-1/2 h-[3px] -translate-x-1/2 rounded-full bg-secondary transition-all duration-300", active === item.href ? "w-5 opacity-100" : "w-0 opacity-0")} /></a>))}</nav>}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {user && !isAdmin && <button onClick={openSettings} className="hidden items-center gap-1.5 rounded-md bg-surface-container px-4 py-2 text-[12px] font-semibold tracking-wide text-primary transition hover:bg-surface-container-high sm:inline-flex"><Settings2 size={14}/>Setting</button>}
          {isAdmin && <button onClick={openAdmin} className="inline-flex items-center gap-1.5 rounded-md bg-secondary/15 px-2.5 py-2 text-[11px] font-semibold tracking-wide text-secondary transition hover:bg-secondary/25 sm:px-4 sm:text-[12px]"><LayoutDashboard size={14}/><span className="hidden sm:inline">Panel Admin</span><span className="sm:hidden">Admin</span></button>}
          {user ? <button onClick={handleSignOut} className="hidden items-center gap-1.5 rounded-md px-4 py-2 text-[12px] font-medium tracking-wide text-primary transition hover:bg-surface-container sm:inline-flex"><LogOut size={14}/>Keluar</button> : <button onClick={openLogin} className="hidden items-center gap-1.5 rounded-md px-4 py-2 text-[12px] font-medium tracking-wide text-primary transition hover:bg-surface-container sm:inline-flex"><LogIn size={14}/>Masuk</button>}
          {!user && <button onClick={() => openRegister()} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[11px] font-medium tracking-wide text-on-primary shadow-lift transition-all hover:-translate-y-px hover:bg-primary-container sm:px-4 sm:text-[12px]"><Lock size={13}/>Daftar</button>}
          <div className="ml-1 hidden h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary sm:flex" title={user?.email ?? "Tamu"}><User size={15} /></div>
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.nav initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-surface-container-high bg-surface/95 backdrop-blur-xl lg:hidden">
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV.map((item) => (<a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={cn("rounded-lg px-3 py-2.5 text-sm font-medium transition", active === item.href ? "bg-primary/10 font-bold text-primary" : "text-on-surface-variant hover:bg-surface-container")}>{item.label}</a>))}
              {user && !isAdmin && <button onClick={() => { setMenuOpen(false); openSettings(); }} className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-primary">Setting</button>}
              {isAdmin && <button onClick={() => { setMenuOpen(false); openAdmin(); }} className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-secondary">Panel Admin</button>}
              <button onClick={() => { setMenuOpen(false); user ? void handleSignOut() : openLogin(); }} className="mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-primary">{user ? "Keluar" : "Masuk ke Akun"}</button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
