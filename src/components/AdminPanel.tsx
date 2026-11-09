import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Database, RefreshCw, Shield, Users, MessageSquare, X } from "lucide-react";
import { useUi, statusLabel } from "../lib/ui";
import { supabase, type Wish, type Lead, type Profile, fetchAllProfiles, updateProfileStatus } from "../lib/supabase";

type LeadRow = Lead & { created_at?: string };

export function AdminPanel() {
  const { user, openLanding, toast } = useUi();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [status, setStatus] = useState("Memuat data...");
  const [source, setSource] = useState<"supabase" | "local" | "mixed">("local");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setStatus("Memuat data..."); setError(null);
    let wishData: Wish[] = []; let leadData: LeadRow[] = [];
    let supaWishOk = false; let supaLeadOk = false;
    const w = await supabase.from("wishes").select("*").order("created_at", { ascending: false }).limit(50);
    if (!w.error && w.data) { wishData = w.data as Wish[]; supaWishOk = true; }
    const l = await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(50);
    if (!l.error && l.data) { leadData = l.data as LeadRow[]; supaLeadOk = true; }
    const p = await fetchAllProfiles();
    if (p.error) setError(`Gagal memuat profiles: ${p.error}. Pastikan supabase/schema.sql sudah dijalankan dan akun admin punya row profiles.role='admin' & status='approved'.`);
    setProfiles(p.profiles); setWishes(wishData); setLeads(leadData);
    const anySupa = supaWishOk || supaLeadOk || p.source === "supabase";
    setSource(p.source === "supabase" && supaWishOk && supaLeadOk ? "supabase" : anySupa ? "mixed" : "local");
    setStatus(anySupa ? `Data dimuat (${p.profiles.length} profil).` : "Data tidak dapat dimuat dari Supabase. Jalankan supabase/schema.sql.");
  };

  useEffect(() => { void load(); }, []);

  const decide = async (id: string, next: "approved" | "rejected") => {
    setBusy(id + next);
    const res = await updateProfileStatus(id, next, user?.id);
    setBusy(null);
    toast(res.ok ? `Akun ${next === "approved" ? "disetujui" : "ditolak"}.` : (res.message || "Gagal memperbarui status."), res.ok);
    if (res.ok) await load(); else setError(res.message || null);
  };

  const pending = useMemo(() => profiles.filter((p) => (p.status ?? "pending") === "pending" && p.role !== "admin"), [profiles]);
  const stats = useMemo(() => ({ leads: leads.length, wishes: wishes.length, pending: pending.length, users: profiles.length }), [leads, wishes, pending, profiles]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 text-on-surface">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-secondary"><Shield size={16} /><span className="text-[11px] font-bold uppercase tracking-[0.18em]">Panel Admin</span></div>
            <h1 className="font-headline text-[32px] text-primary">Dashboard Biz Invite</h1>
            <p className="text-[13px] text-on-surface-variant">Masuk sebagai: <strong>{user?.email}</strong></p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void load().then(()=>toast('Data diperbarui.'))} className="inline-flex items-center gap-2 rounded-md bg-surface-container px-4 py-2 text-[13px] font-semibold text-primary"><RefreshCw size={14}/>Refresh</button>
            <button onClick={openLanding} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-on-primary"><ArrowLeft size={14}/>Kembali ke Web</button>
          </div>
        </div>
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {[{label:'Pending Approval',value:stats.pending,icon:Shield},{label:'Total Akun/Profil',value:stats.users,icon:Users},{label:'Leads',value:stats.leads,icon:Database},{label:'Ucapan/RSVP',value:stats.wishes,icon:MessageSquare}].map((c)=> (
            <div key={c.label} className="rounded-xl bg-surface-container-low p-4 shadow-sm"><div className="mb-2 flex items-center gap-2 text-secondary"><c.icon size={16}/><span className="text-[11px] font-semibold uppercase tracking-[0.12em]">{c.label}</span></div><div className="font-headline text-[28px] text-primary tabular">{String(c.value)}</div></div>
          ))}
        </div>
        {error && <div className="mb-4 rounded-xl bg-red-50 p-4 text-[13px] text-red-700 ring-1 ring-red-200">{error}</div>}
        <div className="mb-6 rounded-xl bg-surface-container-low p-4 text-[13px] text-on-surface-variant shadow-sm">{status} Sumber: <strong>{source}</strong>.</div>

        <section className="mb-6 rounded-xl bg-surface-container-low p-5 shadow-sm">
          <h2 className="mb-3 font-headline text-[22px] text-primary">Persetujuan Akun (akses Setting)</h2>
          <div className="space-y-2">
            {profiles.length === 0 ? <p className="text-[13px] text-on-surface-variant">Belum ada data profil yang bisa ditampilkan. Pastikan `supabase/schema.sql` sudah dijalankan. Jika RLS aman aktif, admin harus punya row di `profiles` dengan `role='admin'` dan `status='approved'`.</p> : profiles.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-lowest p-3">
                <div className="min-w-0"><div className="font-semibold text-primary">{p.display_name || p.email || p.id}</div><div className="text-[12px] text-on-surface-variant">{p.email} • {(p as any).subdomain ? `link: /${(p as any).subdomain} • ` : ""}role: {p.role || 'user'} • status: <strong>{statusLabel(p.status as any)}</strong></div></div>
                {p.role !== 'admin' && (
                  <div className="flex gap-2">
                    <button disabled={busy === p.id + 'approved'} onClick={() => void decide(p.id, 'approved')} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-on-primary disabled:opacity-60"><Check size={14}/>Approve</button>
                    <button disabled={busy === p.id + 'rejected'} onClick={() => void decide(p.id, 'rejected')} className="inline-flex items-center gap-1 rounded-md bg-surface-container px-3 py-1.5 text-[12px] font-semibold text-primary disabled:opacity-60"><X size={14}/>Tolak</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl bg-surface-container-low p-5 shadow-sm"><h2 className="mb-3 font-headline text-[22px] text-primary">Pendaftaran / Leads</h2><div className="max-h-[360px] space-y-2 overflow-auto pr-1">{leads.length === 0 ? <p className="text-[13px] text-on-surface-variant">Belum ada data lead.</p> : leads.map((l, i) => (<div key={(l as any).id ?? i} className="rounded-lg bg-surface-container-lowest p-3"><div className="font-semibold text-primary">{l.couple_names || l.email}</div><div className="text-[12px] text-on-surface-variant">{l.email} • {l.whatsapp} • {l.plan || '-'} • {l.akad_month || '-'}</div></div>))}</div></section>
          <section className="rounded-xl bg-surface-container-low p-5 shadow-sm"><h2 className="mb-3 font-headline text-[22px] text-primary">Ucapan / RSVP</h2><div className="max-h-[360px] space-y-2 overflow-auto pr-1">{wishes.length === 0 ? <p className="text-[13px] text-on-surface-variant">Belum ada data ucapan.</p> : wishes.map((w) => (<div key={w.id} className="rounded-lg bg-surface-container-lowest p-3"><div className="flex items-center justify-between gap-2"><div className="font-semibold text-primary">{w.name}</div><div className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">{w.presence}</div></div><div className="text-[12px] text-on-surface-variant">{w.message}</div></div>))}</div></section>
        </div>
      </div>
    </div>
  );
}
