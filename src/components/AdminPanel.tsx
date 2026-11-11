import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Image as ImageIcon, Loader2, MessageSquare, RefreshCw, Save, Shield, Trash2, Upload, Users, X } from "lucide-react";
import { useUi, statusLabel } from "../lib/ui";
import { supabase, type Wish, type Profile, type InvitationSettingsRow, deleteProfile, deleteWish, fetchAdminWa, fetchAllInvitations, fetchAllProfiles, saveAdminWa, saveInvitationShareImage, updateProfileStatus } from "../lib/supabase";
import { DEFAULT_ADMIN_WA } from "../data/content";
import { uploadMedia } from "../lib/mediaUpload";

export function AdminPanel() {
  const { user, openLanding, toast } = useUi();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [invitations, setInvitations] = useState<InvitationSettingsRow[]>([]);
  const [status, setStatus] = useState("Memuat data...");
  const [source, setSource] = useState<"supabase" | "local" | "mixed">("local");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminWa, setAdminWa] = useState(DEFAULT_ADMIN_WA);
  const [savingWa, setSavingWa] = useState(false);
  const [ogDrafts, setOgDrafts] = useState<Record<string, string>>({});
  const [uploadingInv, setUploadingInv] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTargetInv = useRef<string | null>(null);

  const load = async () => {
    setStatus("Memuat data..."); setError(null);
    let wishData: Wish[] = [];
    let supaWishOk = false;
    const w = await supabase.from("wishes").select("*").order("created_at", { ascending: false }).limit(100);
    if (!w.error && w.data) { wishData = w.data as Wish[]; supaWishOk = true; }
    const p = await fetchAllProfiles();
    const inv = await fetchAllInvitations();
    if (p.error) setError(`Gagal memuat profiles: ${p.error}. Pastikan supabase/schema.sql sudah dijalankan dan akun admin punya row profiles.role='admin' & status='approved'.`);
    else if (inv.error) setError(`Gagal memuat undangan: ${inv.error}`);
    setProfiles(p.profiles); setWishes(wishData); setInvitations(inv.invitations);
    const drafts: Record<string, string> = {};
    inv.invitations.forEach((i) => { drafts[i.id] = (i.settings as any)?.share?.ogImageUrl || ""; });
    setOgDrafts(drafts);
    const wa = await fetchAdminWa(); setAdminWa(wa || DEFAULT_ADMIN_WA);
    const anySupa = supaWishOk || p.source === "supabase";
    setSource(p.source === "supabase" && supaWishOk ? "supabase" : anySupa ? "mixed" : "local");
    setStatus(anySupa ? `Data dimuat (${p.profiles.length} profil, ${inv.invitations.length} undangan).` : "Data tidak dapat dimuat dari Supabase. Jalankan supabase/schema.sql.");
  };

  useEffect(() => { void load(); }, []);

  const invByUser = useMemo(() => {
    const m = new Map<string, InvitationSettingsRow>();
    invitations.forEach((i) => { if (i.user_id && !m.has(i.user_id)) m.set(i.user_id, i); });
    return m;
  }, [invitations]);

  const decide = async (id: string, next: "approved" | "rejected") => {
    setBusy("p:" + id + next);
    const res = await updateProfileStatus(id, next, user?.id);
    setBusy(null);
    toast(res.ok ? `Akun ${next === "approved" ? "disetujui" : "ditolak"}.` : (res.message || "Gagal memperbarui status."), res.ok);
    if (res.ok) await load(); else setError(res.message || null);
  };

  const onDeleteProfile = async (p: Profile) => {
    if (p.role === "admin") { toast("Akun admin tidak dapat dihapus.", false); return; }
    if (!confirm(`Hapus pendaftar ${p.email || p.display_name || p.id}? Profil dan undangan terkait akan dihapus.`)) return;
    setBusy("dp:" + p.id);
    const res = await deleteProfile(p.id);
    setBusy(null);
    toast(res.ok ? "Pendaftar dihapus." : (res.error || "Gagal menghapus pendaftar. Jalankan supabase/schema.sql terbaru (policy delete)."), res.ok);
    if (res.ok) { setProfiles((x) => x.filter((i) => i.id !== p.id)); setInvitations((x) => x.filter((i) => i.user_id !== p.id)); }
  };

  const onDeleteWish = async (w: Wish) => {
    if (!confirm(`Hapus ucapan dari "${w.name}"?`)) return;
    setBusy("dw:" + w.id);
    const res = await deleteWish(w.id);
    setBusy(null);
    toast(res.ok ? "Ucapan dihapus." : (res.error || "Gagal menghapus ucapan. Jalankan supabase/schema.sql terbaru (policy delete)."), res.ok);
    if (res.ok) setWishes((x) => x.filter((i) => i.id !== w.id));
  };

  const onSaveWa = async () => {
    setSavingWa(true);
    const res = await saveAdminWa(adminWa);
    setSavingWa(false);
    toast(res.ok ? "Nomor WhatsApp admin disimpan." : (res.error || "Gagal menyimpan nomor WA. Pastikan tabel app_settings ada (schema terbaru)."), res.ok);
  };

  const onSaveOg = async (invId: string) => {
    setBusy("og:" + invId);
    const res = await saveInvitationShareImage(invId, ogDrafts[invId] || "");
    setBusy(null);
    toast(res.ok ? "Gambar preview share (WA) disimpan." : (res.error || "Gagal menyimpan gambar preview."), res.ok);
    if (res.ok) setInvitations((list) => list.map((i) => i.id === invId ? { ...i, settings: { ...(i.settings as any), share: { ...(i.settings as any)?.share, ogImageUrl: (ogDrafts[invId] || "").trim() } } as any } : i));
  };

  const triggerOgUpload = (invId: string) => {
    uploadTargetInv.current = invId;
    if (fileRef.current) { fileRef.current.value = ""; fileRef.current.click(); }
  };
  const onOgFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const invId = uploadTargetInv.current;
    if (!file || !invId) return;
    setUploadingInv(invId);
    const res = await uploadMedia(file);
    setUploadingInv(null);
    if (res.ok) { setOgDrafts((d) => ({ ...d, [invId]: res.url })); toast("Gambar diunggah. Klik Simpan pada baris pendaftar untuk menerapkan preview share."); }
    else toast(res.error, false);
  };

  const pending = useMemo(() => profiles.filter((p) => (p.status ?? "pending") === "pending" && p.role !== "admin"), [profiles]);
  const stats = useMemo(() => ({ wishes: wishes.length, pending: pending.length, users: profiles.length }), [wishes, pending, profiles]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 text-on-surface">
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onOgFilePicked} />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-secondary"><Shield size={16} /><span className="text-[11px] font-bold uppercase tracking-[0.18em]">Panel Admin</span></div>
            <h1 className="font-headline text-[32px] text-primary">Dashboard Skatim Invitation</h1>
            <p className="text-[13px] text-on-surface-variant">Masuk sebagai: <strong>{user?.email}</strong></p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void load().then(()=>toast('Data diperbarui.'))} className="inline-flex items-center gap-2 rounded-md bg-surface-container px-4 py-2 text-[13px] font-semibold text-primary"><RefreshCw size={14}/>Refresh</button>
            <button onClick={openLanding} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-on-primary"><ArrowLeft size={14}/>Kembali ke Web</button>
          </div>
        </div>
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {[{label:'Pending Approval',value:stats.pending,icon:Shield},{label:'Total Akun/Profil',value:stats.users,icon:Users},{label:'Ucapan/RSVP',value:stats.wishes,icon:MessageSquare}].map((c)=> (
            <div key={c.label} className="rounded-xl bg-surface-container-low p-4 shadow-sm"><div className="mb-2 flex items-center gap-2 text-secondary"><c.icon size={16}/><span className="text-[11px] font-semibold uppercase tracking-[0.12em]">{c.label}</span></div><div className="font-headline text-[28px] text-primary tabular">{String(c.value)}</div></div>
          ))}
        </div>
        {error && <div className="mb-4 rounded-xl bg-red-50 p-4 text-[13px] text-red-700 ring-1 ring-red-200">{error}</div>}
        <div className="mb-6 rounded-xl bg-surface-container-low p-4 text-[13px] text-on-surface-variant shadow-sm">{status} Sumber: <strong>{source}</strong>.</div>

        <section className="mb-6 rounded-xl bg-surface-container-low p-5 shadow-sm">
          <h2 className="mb-3 font-headline text-[22px] text-primary">Pengaturan Kontak Admin</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[260px] flex-1 text-[12px] font-semibold text-primary">Nomor WhatsApp Admin (untuk permohonan approve pendaftar)
              <input value={adminWa} onChange={(e) => setAdminWa(e.target.value)} placeholder="62812xxxx (format internasional, tanpa +)" className="mt-1 w-full rounded-md bg-surface-container-lowest px-3 py-2.5 text-[13.5px] text-on-surface outline-none ring-1 ring-transparent focus:ring-primary/30" />
            </label>
            <button onClick={() => void onSaveWa()} disabled={savingWa} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-[13px] font-semibold text-on-primary disabled:opacity-70">{savingWa ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}Simpan Nomor WA</button>
          </div>
          <p className="mt-2 text-[12px] text-on-surface-variant">Nomor ini dipakai tombol "Chat WhatsApp Admin" di halaman pendaftar (pending). Disimpan ke <code>app_settings</code> (jalankan schema terbaru).</p>
        </section>

        <section className="mb-6 rounded-xl bg-surface-container-low p-5 shadow-sm">
          <h2 className="mb-2 font-headline text-[22px] text-primary">Pendaftar & Preview Share WhatsApp</h2>
          <p className="mb-4 text-[12px] text-on-surface-variant">Atur gambar preview (Open Graph) per undangan pendaftar agar muncul saat link dibagikan di WhatsApp. Simpan URL gambar (upload/hosting), lalu klik Simpan. Berlaku untuk undangan berstatus <strong>published</strong> (OG dibaca middleware di Vercel saat deploy terbaru; WhatsApp dapat cache preview).</p>
          <div className="space-y-3">
            {profiles.length === 0 ? <p className="text-[13px] text-on-surface-variant">Belum ada data profil yang bisa ditampilkan. Pastikan `supabase/schema.sql` sudah dijalankan. Jika RLS aman aktif, admin harus punya row di `profiles` dengan `role='admin'` dan `status='approved'`.</p> : profiles.map((p) => {
              const inv = invByUser.get(p.id);
              const slug = inv?.slug || (p as any).subdomain || "";
              const og = inv ? (ogDrafts[inv.id] ?? (inv.settings as any)?.share?.ogImageUrl ?? "") : "";
              return (
                <div key={p.id} className="rounded-lg bg-surface-container-lowest p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-primary">{p.display_name || p.email || p.id}</div>
                      <div className="text-[12px] text-on-surface-variant">{p.email} • {slug ? <>link: <strong>/{slug}</strong> • </> : ""}role: {p.role || 'user'} • status: <strong>{statusLabel(p.status as any)}</strong>{inv ? <> • undangan: <strong>{inv.status}</strong></> : ""}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {slug && <a href={`/${slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-surface-container px-3 py-1.5 text-[12px] font-semibold text-primary"><ExternalLink size={14}/>Buka</a>}
                      {p.role !== 'admin' && <>
                        <button disabled={busy === 'p:' + p.id + 'approved'} onClick={() => void decide(p.id, 'approved')} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-on-primary disabled:opacity-60"><Check size={14}/>Approve</button>
                        <button disabled={busy === 'p:' + p.id + 'rejected'} onClick={() => void decide(p.id, 'rejected')} className="inline-flex items-center gap-1 rounded-md bg-surface-container px-3 py-1.5 text-[12px] font-semibold text-primary disabled:opacity-60"><X size={14}/>Tolak</button>
                        <button disabled={busy === 'dp:' + p.id} onClick={() => void onDeleteProfile(p)} className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-700 ring-1 ring-red-200 disabled:opacity-60"><Trash2 size={14}/>Hapus</button>
                      </>}
                    </div>
                  </div>
                  {p.role !== 'admin' && (
                    <div className="mt-3 rounded-md bg-surface-container-low/70 p-3">
                      <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-primary"><ImageIcon size={14} className="text-secondary"/>Gambar preview share WhatsApp (OG)</div>
                      {inv ? (
                        <>
                          <div className="flex flex-wrap items-end gap-2">
                            <label className="min-w-[240px] flex-1 text-[11px] text-on-surface-variant">URL gambar preview (JPG/PNG, publik/https disarankan)
                              <input value={og} onChange={(e) => setOgDrafts((d) => ({ ...d, [inv.id]: e.target.value }))} placeholder="https://.../preview.jpg (atau upload)" className="mt-1 w-full rounded-md bg-surface-container-lowest px-3 py-2 text-[13px] text-on-surface outline-none ring-1 ring-transparent focus:ring-primary/30" />
                            </label>
                            <button type="button" onClick={() => triggerOgUpload(inv.id)} disabled={uploadingInv === inv.id} className="inline-flex items-center gap-1.5 rounded-md bg-surface-container px-3 py-2 text-[12px] font-semibold text-primary disabled:opacity-60">{uploadingInv === inv.id ? <Loader2 size={13} className="animate-spin"/> : <Upload size={13}/>}{uploadingInv === inv.id ? "Mengunggah..." : "Upload"}</button>
                            <button type="button" onClick={() => void onSaveOg(inv.id)} disabled={busy === 'og:' + inv.id} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[12px] font-semibold text-on-primary disabled:opacity-70">{busy === 'og:' + inv.id ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}Simpan</button>
                          </div>
                          <div className="mt-2 flex items-center gap-3">
                            {og ? <img src={og} alt="Preview OG" className="h-16 w-28 rounded object-cover ring-1 ring-outline-variant/30" /> : <div className="flex h-16 w-28 items-center justify-center rounded bg-surface-container text-[10px] text-on-surface-variant">Belum diatur</div>}
                            <p className="text-[11px] text-on-surface-variant">Jika kosong, sistem memakai foto cover/mempelai. Pastikan undangan <strong>published</strong> dan deploy Vercel terbaru agar WA menampilkan preview (cache WA bisa butuh waktu/link baru).</p>
                          </div>
                        </>
                      ) : (
                        <p className="text-[12px] text-on-surface-variant">Undangan/setting untuk pendaftar ini belum ditemukan. Pendaftar perlu login & simpan setting (atau pastikan data <code>invitation_settings</code> ada) agar gambar preview bisa diatur.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl bg-surface-container-low p-5 shadow-sm"><h2 className="mb-3 font-headline text-[22px] text-primary">Ucapan / RSVP</h2><div className="max-h-[420px] space-y-2 overflow-auto pr-1">{wishes.length === 0 ? <p className="text-[13px] text-on-surface-variant">Belum ada data ucapan.</p> : wishes.map((w) => (<div key={w.id} className="rounded-lg bg-surface-container-lowest p-3"><div className="flex items-center justify-between gap-2"><div className="font-semibold text-primary">{w.name}</div><div className="flex items-center gap-2"><div className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">{w.presence}</div><button disabled={busy === 'dw:' + w.id} onClick={() => void onDeleteWish(w)} className="rounded-md p-1 text-red-600 hover:bg-red-50 disabled:opacity-60" title="Hapus ucapan"><Trash2 size={14}/></button></div></div><div className="text-[12px] text-on-surface-variant">{w.message}</div></div>))}</div></section>
      </div>
    </div>
  );
}

