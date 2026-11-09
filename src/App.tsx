import { useEffect, useMemo } from "react";
import { UiProvider, useUi } from "./lib/ui";
import { getPublicInviteSlug } from "./lib/inviteRoute";
import { PublicInvitePage } from "./components/PublicInvitePage";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Themes } from "./components/Themes";
import { Features } from "./components/Features";
import { Pricing } from "./components/Pricing";
import { Testimonials } from "./components/Testimonials";
import { Footer } from "./components/Footer";
import { LoginModal, RegisterModal } from "./components/modals/AuthModals";
import { LiveDemoModal } from "./components/modals/LiveDemoModal";
import { AdminPanel } from "./components/AdminPanel";
import { SettingsPage } from "./components/SettingsPage";
import { PendingApproval } from "./components/PendingApproval";

function AppShell() {
  const inviteSlug = useMemo(getPublicInviteSlug, []);
  const { view, setView } = useUi();
  useEffect(() => { if (inviteSlug) setView("invite"); }, [inviteSlug, setView]);
  if (inviteSlug) return <PublicInvitePage slug={inviteSlug} />;

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Header />
      {view === "admin" ? <AdminPanel /> : view === "settings" ? <SettingsPage /> : view === "pending" ? <PendingApproval /> : (
        <>
          <main className="pt-20"><Hero /><Themes /><Features /><Pricing /><Testimonials /></main>
          <Footer />
        </>
      )}
      <LoginModal />
      <RegisterModal />
      <LiveDemoModal />
    </div>
  );
}

export default function App() {
  return (
    <UiProvider><AppShell /></UiProvider>
  );
}
