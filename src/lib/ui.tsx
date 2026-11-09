import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info } from "lucide-react";
import { supabase, getSessionUser, fetchMyProfile, ensureMyProfile, signOutAccount, type Profile, type AccountStatus } from "./supabase";
import type { User } from "@supabase/supabase-js";
import { ADMIN_EMAILS } from "../data/content";

export type ModalKind = "login" | "register" | "demo" | null;
export type AppView = "landing" | "admin" | "settings" | "pending" | "invite";

type UiContextValue = {
  modal: ModalKind; registerPreset: string | null; demoTheme: string; user: User | null; profile: Profile | null;
  isAdmin: boolean; isApproved: boolean; view: AppView; setView: (v: AppView) => void;
  toast: (message: string, ok?: boolean) => void;
  openLogin: () => void; openRegister: (preset?: string) => void; openDemo: (theme?: string) => void; closeModal: () => void;
  createInvite: () => void; openAdmin: () => void; openLanding: () => void; openSettings: () => void; refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
};

const UiContext = createContext<UiContextValue | null>(null);
export function useUi() { const ctx = useContext(UiContext); if (!ctx) throw new Error("useUi harus dipakai di dalam <UiProvider>"); return ctx; }

export function computeIsAdmin(user: User | null, profile?: Profile | null) {
  const email = user?.email?.toLowerCase();
  if (email && ADMIN_EMAILS.map((x) => x.toLowerCase()).includes(email)) return true;
  const role = profile?.role ?? (user?.user_metadata?.role as string | undefined) ?? (user?.app_metadata?.role as string | undefined);
  return role === "admin";
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalKind>(null);
  const [registerPreset, setRegisterPreset] = useState<string | null>(null);
  const [demoTheme, setDemoTheme] = useState("Islami Emerald");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<AppView>("landing");
  const [toastState, setToastState] = useState<{ id: number; message: string; ok: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) { setProfile(null); return; }
    let p = await fetchMyProfile(u.id);
    if (!p) p = await ensureMyProfile(u);
    if (computeIsAdmin(u, p) && p && (p.role !== "admin" || p.status !== "approved")) {
      await supabase.from("profiles").upsert({ id: u.id, email: u.email, display_name: p.display_name ?? "", role: "admin", status: "approved" }, { onConflict: "id" });
      p = await fetchMyProfile(u.id);
    }
    setProfile(p);
  }, []);

  const refreshProfile = useCallback(async () => {
    const u = await getSessionUser(); setUser(u); await loadProfile(u);
  }, [loadProfile]);

  useEffect(() => {
    void refreshProfile();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null; setUser(u); void loadProfile(u);
    });
    return () => sub.subscription.unsubscribe();
  }, [refreshProfile, loadProfile]);

  const isAdmin = useMemo(() => computeIsAdmin(user, profile), [user, profile]);
  const isApproved = useMemo(() => isAdmin || profile?.status === "approved", [isAdmin, profile]);

  useEffect(() => {
    if ((view as AppView) === "invite") return; if (view === "admin" && user && !isAdmin) setView("landing");
    if (view === "settings" && user && !isApproved) setView("pending");
    if (view === "pending" && user && isApproved) setView("settings");
    if ((view as AppView) === "invite") return; const hash = view === "landing" ? "" : view;
    if (window.location.hash.replace('#','') !== hash) window.location.hash = hash;
  }, [view, user, isAdmin, isApproved]);

  const toast = useCallback((message: string, ok = true) => {
    if (timer.current) clearTimeout(timer.current);
    setToastState({ id: Date.now(), message, ok });
    timer.current = setTimeout(() => setToastState(null), 3800);
  }, []);

  const openRegister = useCallback((preset?: string) => { setRegisterPreset(preset ?? null); setModal("register"); }, []);
  const openLanding = useCallback(() => { setView("landing"); if (window.location.pathname !== "/" && window.location.pathname !== "/index.html") window.history.replaceState({}, "", "/"); window.location.hash = ""; }, []);

  const openAdmin = useCallback(async () => {
    const u = user ?? await getSessionUser();
    if (!u) { toast("Masuk sebagai admin terlebih dahulu.", false); setModal("login"); return; }
    const p = profile ?? await fetchMyProfile(u.id);
    if (!computeIsAdmin(u, p)) { toast(`Akun ${u.email ?? ""} bukan admin.`, false); return; }
    setView("admin"); window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user, profile, toast]);

  const openSettings = useCallback(async () => {
    const u = user ?? await getSessionUser();
    if (!u) { toast("Daftar atau masuk terlebih dahulu.", false); openRegister("Akses Setting"); return; }
    const p = profile ?? await fetchMyProfile(u.id);
    if (p) setProfile(p);
    if (computeIsAdmin(u, p) || p?.status === "approved") { setView("settings"); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else { setView("pending"); toast("Akun menunggu persetujuan admin sebelum bisa masuk ke setting.", false); }
  }, [user, profile, toast, openRegister]);

  const createInvite = useCallback(() => { void openSettings(); }, [openSettings]);
  const logout = useCallback(async () => { await signOutAccount(); setUser(null); setProfile(null); setView("landing"); window.location.hash = ""; }, []);

  const value = useMemo<UiContextValue>(() => ({
    modal, registerPreset, demoTheme, user, profile, isAdmin, isApproved, view, setView, toast,
    openLogin: () => setModal("login"), openRegister,
    openDemo: (theme) => { if (theme) setDemoTheme(theme); setModal("demo"); },
    closeModal: () => setModal(null), createInvite,
    openAdmin: () => { void openAdmin(); }, openLanding, openSettings: () => { void openSettings(); }, refreshProfile, logout,
  }), [modal, registerPreset, demoTheme, user, profile, isAdmin, isApproved, view, setView, toast, openRegister, createInvite, openAdmin, openLanding, openSettings, refreshProfile, logout]);

  return (
    <UiContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {toastState && (
          <motion.div key={toastState.id} initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ type: "spring", stiffness: 380, damping: 30 }} className="fixed bottom-6 right-6 z-[90] flex max-w-sm items-center gap-2.5 rounded-2xl bg-inverse-surface px-5 py-3.5 shadow-2xl" role="status">
            {toastState.ok ? <CheckCircle2 size={18} className="shrink-0 text-secondary-fixed-dim" /> : <Info size={18} className="shrink-0 text-inverse-on-surface/70" />}
            <span className="text-[13px] leading-5 text-inverse-on-surface">{toastState.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </UiContext.Provider>
  );
}

export function statusLabel(status?: AccountStatus | null) {
  if (status === "approved") return "Disetujui";
  if (status === "rejected") return "Ditolak";
  return "Menunggu persetujuan";
}
