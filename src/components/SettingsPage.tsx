import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, CheckCircle2, Database, ExternalLink, LayoutTemplate, Loader2, MessageSquare, Plus, RefreshCw, Save, Settings2, Share2, Trash2, Upload } from "lucide-react";
import { useUi } from "../lib/ui";
import { THEMES } from "../data/content";
import { deleteWish, fetchMyInvitation, fetchWishes, saveMyInvitation, subscribeWishes, type InvitationSettingsRow, type Wish } from "../lib/supabase";
import { defaultStructuredSettings, mergeSettings, sectionList, themeName, type StructuredSettings } from "../lib/invitationSettings";
import { uploadMedia } from "../lib/mediaUpload";

type SectionKey = ReturnType<typeof sectionList>[number]["key"];
const inputCls = "mt-1 w-full rounded-md bg-surface-container-lowest px-3 py-2.5 text-[13.5px] text-on-surface outline-none ring-1 ring-transparent focus:ring-primary/30";
const labelCls = "text-[11.5px] font-semibold tracking-wide text-on-surface";
const cardCls = "rounded-xl bg-surface-container-low p-5 shadow-sm";
function extractMapEmbedSrc(value: string) {
  const v = (value || "").trim();
  if (!v) return "";
  const m = v.match(/src\s*=\s*["\']([^"\']+)["\']/i);
  if (m && m[1]) return m[1].trim();
  return /^https?:\/\//i.test(v) ? v : v;
}
function Field({ label, children, span = false }: { label: string; children: ReactNode; span?: boolean }) {
  return <label className={`${labelCls}${span ? " sm:col-span-2" : ""}`}>{label}{children}</label>;
}

export function SettingsPage() {
  const { user, profile, openLanding, toast } = useUi();
  const [section, setSection] = useState<SectionKey>("general");
  const [row, setRow] = useState<InvitationSettingsRow | null>(null);
  const [settings, setSettings] = useState<StructuredSettings>(() => defaultStructuredSettings(profile?.display_name || ""));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState<"supabase" | "local">("local");
  const [error, setError] = useState<string | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wishesSource, setWishesSource] = useState<"supabase" | "local">("local");
  const [wishesLoading, setWishesLoading] = useState(false);
  const [wishBusy, setWishBusy] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileTarget = useRef<{ accept: string; key: string; onUrl: (url: string) => void } | null>(null);

  const pickUpload = (key: string, accept: string, onUrl: (url: string) => void) => {
    fileTarget.current = { key, accept, onUrl };
    if (fileRef.current) { fileRef.current.value = ""; fileRef.current.accept = accept; fileRef.current.click(); }
  };
  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = fileTarget.current;
    if (!file || !target) return;
    setUploading(target.key);
    const res = await uploadMedia(file);
    setUploading(null);
    if (res.ok) { target.onUrl(res.url); toast("File diunggah. URL tersimpan di isian � klik Simpan ke Supabase."); }
    else { setError(res.error); toast(res.error, false); }
  };
  const UpBtn = ({ k, accept, onUrl, label = "Upload" }: { k: string; accept: string; onUrl: (u: string) => void; label?: string }) => (
    <button type="button" onClick={() => pickUpload(k, accept, onUrl)} disabled={!!uploading} className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-surface-container px-2.5 py-1.5 text-[11.5px] font-semibold text-primary disabled:opacity-60">
      {uploading === k ? <Loader2 size={13} className="animate-spin"/> : <Upload size={13}/>}{uploading === k ? "Mengunggah..." : label}
    </button>
  );

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true); setError(null);
    void fetchMyInvitation(user.id, profile?.display_name || "").then((res) => {
      if (!alive) return;
      setSource(res.source);
      if (res.error) setError(`Schema/settings belum tersimpan ke Supabase: ${res.error}. Jalankan supabase/schema.sql (tabel invitation_settings). Fallback lokal aktif.`);
      const base = res.row ? mergeSettings({ ...res.row.settings, general: { ...(res.row.settings as any)?.general, slug: res.row.slug || (profile as any)?.subdomain || (res.row.settings as any)?.general?.slug || "", themeId: res.row.theme_id || (res.row.settings as any)?.general?.themeId || "islami-emerald" } }, res.row.title) : (() => { const d = defaultStructuredSettings(profile?.display_name || user.user_metadata?.display_name || ""); d.general.slug = (profile as any)?.subdomain || d.general.slug; return d; })();
      setSettings(base); setRow(res.row ?? null); setLoading(false);
    });
    return () => { alive = false; };
  }, [user, profile?.display_name]);

  const loadWishes = async () => {
    const invId = row?.id || "";
    const slug = (row?.slug || settings.general.slug || (profile as any)?.subdomain || "").trim();
    if (!invId && !slug) { setWishes([]); return; }
    setWishesLoading(true);
    const res = await fetchWishes({ invitationId: invId || undefined, slug: slug || undefined });
    setWishes(res.wishes);
    setWishesSource(res.source);
    setWishesLoading(false);
  };

  useEffect(() => {
    const invId = row?.id || "";
    const slug = (row?.slug || settings.general.slug || (profile as any)?.subdomain || "").trim();
    if (!invId && !slug) { setWishes([]); return; }
    let alive = true;
    setWishesLoading(true);
    void fetchWishes({ invitationId: invId || undefined, slug: slug || undefined }).then((res) => {
      if (!alive) return;
      setWishes(res.wishes); setWishesSource(res.source); setWishesLoading(false);
    });
    const unsub = subscribeWishes((w) => setWishes((p) => (p.some((x) => x.id === w.id) ? p : [w, ...p])), { invitationId: invId || undefined, slug: slug || undefined });
    return () => { alive = false; unsub(); };
  }, [row?.id, row?.slug, settings.general.slug, (profile as any)?.subdomain]);

  const set = <K extends keyof StructuredSettings>(key: K, value: StructuredSettings[K]) => setSettings((s) => ({ ...s, [key]: value }));

  const save = async () => {
    if (!user) return;
    setSaving(true); setError(null);
    const payload: Partial<InvitationSettingsRow> & { settings: StructuredSettings } = {
      id: row?.id,
      slug: settings.general.slug || null,
      theme_id: settings.general.themeId,
      status: settings.general.status,
      title: settings.general.title || `${settings.couple.groom.name} & ${settings.couple.bride.name}`,
      settings: {
        ...settings,
        general: { ...settings.general, title: settings.general.title || `${settings.couple.groom.name} & ${settings.couple.bride.name}`, themeId: settings.general.themeId, status: settings.general.status },
      },
    };
    const res = await saveMyInvitation(user.id, payload);
    setSaving(false); setSource(res.source);
    if (res.row) setRow(res.row);
    if (res.error) { setError(`Tersimpan lokal (fallback). Supabase: ${res.error}. Jalankan supabase/schema.sql jika tabel invitation_settings/RLS belum ada.`); toast("Pengaturan tersimpan lokal. Cek schema Supabase untuk simpan cloud.", false); }
    else toast("Pengaturan tersimpan ke Supabase.");
  };

  const onDeleteWish = async (w: Wish) => {
    if (!confirm(`Hapus ucapan dari "${w.name}"?`)) return;
    setWishBusy(w.id);
    const res = await deleteWish(w.id);
    setWishBusy(null);
    toast(res.ok ? "Ucapan dihapus." : (res.error || "Gagal menghapus ucapan. Pastikan schema/policy delete wishes sudah dijalankan."), res.ok);
    if (res.ok) setWishes((x) => x.filter((i) => i.id !== w.id));
  };

  const sections = sectionList();
  const activeLabel = sections.find((s) => s.key === section)?.label ?? section;
  const inviteSlug = (row?.slug || settings.general.slug || (profile as any)?.subdomain || "").trim();
  const inviteUrl = inviteSlug ? `${window.location.origin}/${inviteSlug}` : "";
  const shareWa = () => {
    if (!inviteUrl) { toast("Alamat link undangan belum tersedia.", false); return; }
    const text = `Assalamualaikum,\n\nDengan hormat kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara kami.\n\nBuka undangan: ${inviteUrl}\n\nTerima kasih.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background px-5 pb-12 pt-28 text-on-surface">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-secondary"><Settings2 size={16} /><span className="text-[11px] font-bold uppercase tracking-[0.18em]">Setting Undangan</span></div>
            <h1 className="font-headline text-[32px] text-primary">Studio Pengaturan Terstruktur</h1>
            <p className="text-[13px] text-on-surface-variant">{user?.email} • Status akun: <strong>{profile?.status === "approved" ? "Disetujui" : profile?.status}</strong> • Penyimpanan: <strong>{source}</strong></p>
          </div>
          <div className="flex flex-wrap gap-2">
            {inviteSlug && (
              <>
                <a href={`/${inviteSlug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-surface-container px-4 py-2 text-[13px] font-semibold text-primary"><ExternalLink size={14}/>Lihat Undangan</a>
                <button type="button" onClick={shareWa} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-green-700"><Share2 size={14}/>Share WA</button>
              </>
            )}
            <button onClick={openLanding} className="inline-flex items-center gap-2 rounded-md bg-surface-container px-4 py-2 text-[13px] font-semibold text-primary"><ArrowLeft size={14}/>Kembali</button>
            <button onClick={() => void save()} disabled={saving || loading} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-on-primary disabled:opacity-70">{saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}Simpan ke Supabase</button>
          </div>
        </div>
        {error && <div className="mb-5 rounded-xl bg-amber-50 p-4 text-[13px] text-amber-900 ring-1 ring-amber-200">{error}</div>}
        <input ref={fileRef} type="file" className="hidden" onChange={onFilePicked} />
        {loading ? <div className="flex items-center justify-center rounded-xl bg-surface-container-low p-10"><Loader2 className="animate-spin text-primary"/></div> : (
          <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
            <aside className={cardCls + " h-fit"}>
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">Section</div>
              <div className="space-y-1">{sections.map((s) => (<button key={s.key} onClick={() => setSection(s.key)} className={`w-full rounded-lg px-3 py-2 text-left text-[13px] font-medium ${section === s.key ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"}`}>{s.label}</button>))}</div>
            </aside>
            <main className={cardCls}>
              <h2 className="mb-4 font-headline text-[24px] text-primary">{activeLabel}</h2>
              {section === "general" && <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Judul undangan"><input className={inputCls} value={settings.general.title} onChange={(e) => set("general", { ...settings.general, title: e.target.value })} /></Field>
                <Field label="Alamat link (slug)"><input className={inputCls + " opacity-80"} value={settings.general.slug || profile?.subdomain || ""} readOnly disabled /><p className="mt-1 text-[11px] text-on-surface-variant">Ditetapkan saat pendaftaran dan dikunci (path setelah domain, hanya sekali pakai).</p></Field>
                <Field label="Foto sampul / cover (URL atau upload)" span>
                  <input className={inputCls} value={settings.hero.coverImageUrl} onChange={(e) => set("hero", { ...settings.hero, coverImageUrl: e.target.value })} placeholder="https://.../cover.jpg (atau unggah file)" />
                  <UpBtn k="hero-cover" accept="image/*" onUrl={(url) => set("hero", { ...settings.hero, coverImageUrl: url })} label="Upload foto cover" />
                  <p className="mt-1 text-[11px] text-on-surface-variant">Simpan file di server/hosting Anda (tanpa symlink), lalu pakai URL-nya. Supabase hanya menyimpan URL.</p>
                </Field>
                <Field label="Gambar preview saat link dibagikan (WhatsApp/OG, opsional)" span>
                  <input className={inputCls} value={settings.share?.ogImageUrl || ""} onChange={(e) => set("share", { ...(settings.share || { ogImageUrl: "" }), ogImageUrl: e.target.value })} placeholder="https://.../preview-wa.jpg (disarankan 1200x630, publik/HTTPS)" />
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <UpBtn k="share-og" accept="image/*" onUrl={(url) => set("share", { ...(settings.share || { ogImageUrl: "" }), ogImageUrl: url })} label="Upload gambar preview" />
                    {settings.share?.ogImageUrl ? <img src={settings.share.ogImageUrl} alt="Preview share" className="h-14 w-24 rounded object-cover ring-1 ring-outline-variant/30" /> : null}
                  </div>
                  <p className="mt-1 text-[11px] text-on-surface-variant">Gambar ini dipakai sebagai preview saat link undangan dibagikan di WhatsApp. Jika kosong, sistem memakai foto cover/mempelai. Berlaku setelah undangan <strong>published</strong> dan deploy (cache WA bisa butuh waktu/link baru).</p>
                </Field>
                <Field label="Tema"><select className={inputCls} value={settings.general.themeId} onChange={(e) => set("general", { ...settings.general, themeId: e.target.value })}>{THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
                <Field label="Status"><select className={inputCls} value={settings.general.status} onChange={(e) => set("general", { ...settings.general, status: e.target.value as any })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></Field>
                <Field label="Timezone"><input className={inputCls} value={settings.general.timezone} onChange={(e) => set("general", { ...settings.general, timezone: e.target.value })} /></Field>
                <Field label="Bahasa"><input className={inputCls} value={settings.general.language} onChange={(e) => set("general", { ...settings.general, language: e.target.value })} /></Field>
              </div>}
              {section === "couple" && <div className="space-y-5">{(["groom","bride"] as const).map((side) => (
                <div key={side} className="rounded-lg bg-surface-container-lowest p-4">
                  <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-secondary">{side === "groom" ? "Mempelai Pria" : "Mempelai Wanita"}</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Nama"><input className={inputCls} value={settings.couple[side].name} onChange={(e) => set("couple", { ...settings.couple, [side]: { ...settings.couple[side], name: e.target.value } })} /></Field>
                    <Field label="Label (Putra/Putri)"><input className={inputCls} value={settings.couple[side].childOrder} onChange={(e) => set("couple", { ...settings.couple, [side]: { ...settings.couple[side], childOrder: e.target.value } })} /></Field>
                    <Field label="Ayah"><input className={inputCls} value={settings.couple[side].father} onChange={(e) => set("couple", { ...settings.couple, [side]: { ...settings.couple[side], father: e.target.value } })} /></Field>
                    <Field label="Ibu"><input className={inputCls} value={settings.couple[side].mother} onChange={(e) => set("couple", { ...settings.couple, [side]: { ...settings.couple[side], mother: e.target.value } })} /></Field>
                    <Field label="Foto (URL atau upload)" span>
                      <input className={inputCls} value={settings.couple[side].photoUrl} onChange={(e) => set("couple", { ...settings.couple, [side]: { ...settings.couple[side], photoUrl: e.target.value } })} placeholder="https://.../foto.jpg (atau unggah file)" />
                      <div className="flex flex-wrap items-center gap-2">
                        <UpBtn k={`couple-${side}`} accept="image/*" onUrl={(url) => set("couple", { ...settings.couple, [side]: { ...settings.couple[side], photoUrl: url } })} label="Upload foto" />
                        {settings.couple[side].photoUrl ? <img src={settings.couple[side].photoUrl} alt="" className="mt-1 h-12 w-12 rounded object-cover ring-1 ring-outline-variant/30" /> : null}
                      </div>
                    </Field>
                  </div>
                </div>
              ))}</div>}
              {section === "event" && <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Tanggal tampil"><input className={inputCls} value={settings.event.dateDisplay} onChange={(e) => set("event", { ...settings.event, dateDisplay: e.target.value })} /></Field>
                  <Field label="Countdown (datetime-local)"><input type="datetime-local" className={inputCls} value={settings.event.countdownIso} onChange={(e) => set("event", { ...settings.event, countdownIso: e.target.value })} /></Field>
                </div>
                <div className="flex items-center justify-between"><div className="text-[13px] font-semibold">Daftar Acara</div><button onClick={() => set("event", { ...settings.event, events: [...settings.event.events, { type: "custom", title: "Acara", date: settings.event.countdownIso.slice(0, 10), start: "09:00", end: "10:00", venue: "", address: "", mapUrl: "", note: "" }] })} className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2.5 py-1.5 text-[12px] font-semibold text-primary"><Plus size={13}/>Tambah</button></div>
                {settings.event.events.map((ev, i) => (
                  <div key={i} className="rounded-lg bg-surface-container-lowest p-4">
                    <div className="mb-2 flex items-center justify-between"><strong className="text-[13px] text-primary">{ev.title || `Acara ${i + 1}`}</strong><button onClick={() => set("event", { ...settings.event, events: settings.event.events.filter((_, j) => j !== i) })} className="text-red-600"><Trash2 size={14}/></button></div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Judul"><input className={inputCls} value={ev.title} onChange={(e) => { const events = [...settings.event.events]; events[i] = { ...ev, title: e.target.value }; set("event", { ...settings.event, events }); }} /></Field>
                      <Field label="Tipe"><select className={inputCls} value={ev.type} onChange={(e) => { const events = [...settings.event.events]; events[i] = { ...ev, type: e.target.value as any }; set("event", { ...settings.event, events }); }}><option value="akad">Akad</option><option value="resepsi">Resepsi</option><option value="custom">Custom</option></select></Field>
                      <Field label="Tanggal"><input type="date" className={inputCls} value={ev.date} onChange={(e) => { const events = [...settings.event.events]; events[i] = { ...ev, date: e.target.value }; set("event", { ...settings.event, events }); }} /></Field>
                      <Field label="Jam mulai"><input type="time" className={inputCls} value={ev.start} onChange={(e) => { const events = [...settings.event.events]; events[i] = { ...ev, start: e.target.value }; set("event", { ...settings.event, events }); }} /></Field>
                      <Field label="Tempat" span><input className={inputCls} value={ev.venue} onChange={(e) => { const events = [...settings.event.events]; events[i] = { ...ev, venue: e.target.value }; set("event", { ...settings.event, events }); }} /></Field>
                      <Field label="Alamat" span><textarea rows={2} className={inputCls} value={ev.address} onChange={(e) => { const events = [...settings.event.events]; events[i] = { ...ev, address: e.target.value }; set("event", { ...settings.event, events }); }} /></Field>
                      <Field label="Link Maps" span><input className={inputCls} value={ev.mapUrl} onChange={(e) => { const events = [...settings.event.events]; events[i] = { ...ev, mapUrl: e.target.value }; set("event", { ...settings.event, events }); }} /></Field>
                    </div>
                  </div>
                ))}
              </div>}
              {section === "location" && <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Alamat utama" span><textarea rows={2} className={inputCls} value={settings.location.primaryAddress} onChange={(e) => set("location", { ...settings.location, primaryAddress: e.target.value })} /></Field>
                <Field label="Google Maps (embed URL atau tempel kode &lt;iframe&gt;)" span><textarea rows={3} className={inputCls} placeholder="https://www.google.com/maps/embed?pb=... atau tempel seluruh kode <iframe ...>" value={settings.location.mapEmbedUrl} onChange={(e) => set("location", { ...settings.location, mapEmbedUrl: extractMapEmbedSrc(e.target.value) })} /></Field>
                <Field label="Link Maps (buka di Google Maps)" span><input className={inputCls} placeholder="https://maps.google.com/... atau https://maps.app.goo.gl/..." value={settings.location.mapLink} onChange={(e) => set("location", { ...settings.location, mapLink: e.target.value.trim() })} /></Field>
                {settings.location.mapEmbedUrl ? <div className="sm:col-span-2 overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-lowest"><iframe title="Preview peta" src={settings.location.mapEmbedUrl} className="aspect-video w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div> : <p className="sm:col-span-2 text-[11px] text-on-surface-variant">Tempel kode embed dari Google Maps (Bagikan → Sematkan peta) atau URL embed. Pratinjau peta muncul di sini setelah URL valid.</p>}
              </div>}
              {section === "content" && <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Pembuka / salam" span><textarea rows={3} className={inputCls} value={settings.content.greeting} onChange={(e) => set("content", { ...settings.content, greeting: e.target.value })} /></Field>
                <label className="flex items-center gap-2 text-[13px] sm:col-span-2"><input type="checkbox" checked={settings.content.verseEnabled} onChange={(e) => set("content", { ...settings.content, verseEnabled: e.target.checked })} />Tampilkan ayat Islami</label>
                <Field label="Ayat (Arab)" span><textarea rows={2} className={inputCls} value={settings.content.verseAr} onChange={(e) => set("content", { ...settings.content, verseAr: e.target.value })} /></Field>
                <Field label="Terjemah" span><textarea rows={3} className={inputCls} value={settings.content.verseText} onChange={(e) => set("content", { ...settings.content, verseText: e.target.value })} /></Field>
                <Field label="Sumber ayat"><input className={inputCls} value={settings.content.verseSource} onChange={(e) => set("content", { ...settings.content, verseSource: e.target.value })} /></Field>
                <Field label="Penutup" span><textarea rows={3} className={inputCls} value={settings.content.closing} onChange={(e) => set("content", { ...settings.content, closing: e.target.value })} /></Field>
              </div>}
              {section === "gallery" && <div className="space-y-3">
                <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={settings.gallery.enabled} onChange={(e) => set("gallery", { ...settings.gallery, enabled: e.target.checked })} />Aktifkan galeri</label>
                <p className="text-[11px] text-on-surface-variant">Unggah foto ke server/hosting Anda (tanpa symlink) atau tempel URL. Supabase hanya menyimpan URL.</p>
                <button onClick={() => set("gallery", { ...settings.gallery, images: [...settings.gallery.images, { url: "", caption: "" }] })} className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2.5 py-1.5 text-[12px] font-semibold text-primary"><Plus size={13}/>Tambah gambar</button>
                {settings.gallery.images.map((img, i) => (
                  <div key={i} className="rounded-lg bg-surface-container-lowest p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-start">
                      <div>
                        <input className={inputCls + " mt-0"} placeholder="URL gambar" value={img.url} onChange={(e) => { const images = [...settings.gallery.images]; images[i] = { ...img, url: e.target.value }; set("gallery", { ...settings.gallery, images }); }} />
                        <UpBtn k={`gallery-${i}`} accept="image/*" onUrl={(url) => { const images = [...settings.gallery.images]; images[i] = { ...img, url }; set("gallery", { ...settings.gallery, images }); }} label="Upload gambar" />
                      </div>
                      <input className={inputCls + " mt-0"} placeholder="Caption" value={img.caption} onChange={(e) => { const images = [...settings.gallery.images]; images[i] = { ...img, caption: e.target.value }; set("gallery", { ...settings.gallery, images }); }} />
                      <button onClick={() => set("gallery", { ...settings.gallery, images: settings.gallery.images.filter((_, j) => j !== i) })} className="rounded-md px-2 pt-2 text-red-600"><Trash2 size={14}/></button>
                    </div>
                    {img.url ? <img src={img.url} alt="" className="mt-2 h-20 w-full max-w-[180px] rounded object-cover ring-1 ring-outline-variant/20" /> : null}
                  </div>
                ))}
              </div>}
              {section === "rsvp" && <div className="space-y-3">
                <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={settings.rsvp.enabled} onChange={(e) => set("rsvp", { ...settings.rsvp, enabled: e.target.checked })} />Aktifkan RSVP & ucapan</label>
                <Field label="Opsi kehadiran (pisahkan dengan koma)" span><input className={inputCls} value={settings.rsvp.presenceOptions.join(", ")} onChange={(e) => set("rsvp", { ...settings.rsvp, presenceOptions: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></Field>
                <p className="text-[12px] text-on-surface-variant">Lihat ucapan/RSVP yang masuk di section <strong>Ucapan Masuk</strong>.</p>
              </div>}
              {section === "inbox" && <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[13px] text-on-surface-variant">Ucapan & RSVP untuk undangan Anda{(row?.slug || settings.general.slug) ? <> (/<strong>{row?.slug || settings.general.slug}</strong>)</> : ""}. Sumber: <strong>{wishesSource}</strong>.</div>
                  <button type="button" onClick={() => void loadWishes()} disabled={wishesLoading} className="inline-flex items-center gap-1.5 rounded-md bg-surface-container px-3 py-1.5 text-[12px] font-semibold text-primary disabled:opacity-60">{wishesLoading ? <Loader2 size={13} className="animate-spin"/> : <RefreshCw size={13}/>}Refresh</button>
                </div>
                <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                  {wishesLoading && wishes.length === 0 ? <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-primary"/></div>
                  : wishes.length === 0 ? <p className="text-[13px] text-on-surface-variant">Belum ada ucapan/RSVP masuk untuk undangan ini.</p>
                  : wishes.map((w) => (
                    <div key={w.id} className="rounded-lg bg-surface-container-lowest p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-primary">{w.name}</div>
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">{w.presence}</div>
                          <button type="button" disabled={wishBusy === w.id} onClick={() => void onDeleteWish(w)} className="rounded-md p-1 text-red-600 hover:bg-red-50 disabled:opacity-60" title="Hapus ucapan"><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <div className="mt-1 text-[12.5px] leading-6 text-on-surface-variant">{w.message}</div>
                      <div className="mt-1 text-[10.5px] text-on-surface-variant/70">{w.created_at ? new Date(w.created_at).toLocaleString("id-ID") : ""}</div>
                    </div>
                  ))}
                </div>
              </div>}
              {section === "gift" && <div className="space-y-3">
                <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={settings.gift.enabled} onChange={(e) => set("gift", { ...settings.gift, enabled: e.target.checked })} />Aktifkan amplop digital</label>
                <Field label="Catatan" span><textarea rows={2} className={inputCls} value={settings.gift.note} onChange={(e) => set("gift", { ...settings.gift, note: e.target.value })} /></Field>
                <button onClick={() => set("gift", { ...settings.gift, accounts: [...settings.gift.accounts, { bank: "", number: "", name: "", qrisUrl: "" }] })} className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2.5 py-1.5 text-[12px] font-semibold text-primary"><Plus size={13}/>Tambah rekening</button>
                {settings.gift.accounts.map((a, i) => (
                  <div key={i} className="grid gap-3 rounded-lg bg-surface-container-lowest p-4 sm:grid-cols-2">
                    <Field label="Bank/Wallet"><input className={inputCls} value={a.bank} onChange={(e) => { const accounts = [...settings.gift.accounts]; accounts[i] = { ...a, bank: e.target.value }; set("gift", { ...settings.gift, accounts }); }} /></Field>
                    <Field label="Nomor"><input className={inputCls} value={a.number} onChange={(e) => { const accounts = [...settings.gift.accounts]; accounts[i] = { ...a, number: e.target.value }; set("gift", { ...settings.gift, accounts }); }} /></Field>
                    <Field label="Atas nama" span><input className={inputCls} value={a.name} onChange={(e) => { const accounts = [...settings.gift.accounts]; accounts[i] = { ...a, name: e.target.value }; set("gift", { ...settings.gift, accounts }); }} /></Field>
                    <Field label="Gambar QRIS (URL atau upload, opsional)" span>
                      <input className={inputCls} value={a.qrisUrl || ""} onChange={(e) => { const accounts = [...settings.gift.accounts]; accounts[i] = { ...a, qrisUrl: e.target.value }; set("gift", { ...settings.gift, accounts }); }} placeholder="https://.../qris.jpg" />
                      <UpBtn k={`qris-${i}`} accept="image/*" onUrl={(url) => { const accounts = [...settings.gift.accounts]; accounts[i] = { ...a, qrisUrl: url }; set("gift", { ...settings.gift, accounts }); }} label="Upload QRIS" />
                    </Field>
                    <div className="sm:col-span-2"><button onClick={() => set("gift", { ...settings.gift, accounts: settings.gift.accounts.filter((_, j) => j !== i) })} className="text-[12px] font-semibold text-red-600">Hapus rekening</button></div>
                  </div>
                ))}
              </div>}
              {section === "audio" && <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-[13px] sm:col-span-2"><input type="checkbox" checked={settings.audio.enabled} onChange={(e) => set("audio", { ...settings.audio, enabled: e.target.checked })} />Aktifkan audio</label>
                <Field label="Mode"><select className={inputCls} value={settings.audio.mode} onChange={(e) => set("audio", { ...settings.audio, mode: e.target.value as any })}><option value="soft">Lembut</option><option value="nature">Alam</option><option value="beat">Ringan</option></select></Field>
                <Field label="Audio (URL atau upload, opsional)" span>
                  <input className={inputCls} value={settings.audio.url} onChange={(e) => set("audio", { ...settings.audio, url: e.target.value })} placeholder="https://.../musik.mp3 (atau unggah file)" />
                  <UpBtn k="audio" accept="audio/*,.mp3,.ogg,.wav,.m4a" onUrl={(url) => set("audio", { ...settings.audio, url })} label="Upload audio" />
                  <p className="mt-1 text-[11px] text-on-surface-variant">Gunakan URL langsung (.mp3/.ogg). Simpan di server/hosting (tanpa symlink); Supabase hanya menyimpan URL. Jika CORS/hotlink diblokir, pemutar bisa fallback ke synth.</p>
                </Field>
              </div>}
              {section === "privacy" && <div className="space-y-3 text-[13px]">
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.privacy.hidePhotos} onChange={(e) => set("privacy", { ...settings.privacy, hidePhotos: e.target.checked })} />Sembunyikan/samarkan foto (Hijab-safe)</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.privacy.maskGuestName} onChange={(e) => set("privacy", { ...settings.privacy, maskGuestName: e.target.checked })} />Samarkan nama tamu pada tampilan tertentu</label>
              </div>}
            </main>
            <aside className={cardCls + " h-fit"}>
              <h2 className="mb-3 flex items-center gap-2 font-headline text-[20px] text-primary"><LayoutTemplate size={17}/>Ringkasan</h2>
              <div className="space-y-2 text-[12.5px] text-on-surface-variant">
                <div><strong className="text-primary">Judul:</strong> {settings.general.title || "-"}</div>
                <div><strong className="text-primary">Tema:</strong> {themeName(settings.general.themeId)}</div>
                <div><strong className="text-primary">Status:</strong> {settings.general.status}</div>
                <div><strong className="text-primary">Alamat link:</strong> /{settings.general.slug || (profile as any)?.subdomain || "(dikunci saat daftar)"}</div>
                <div><strong className="text-primary">Acara:</strong> {settings.event.events.length} item</div>
                <div><strong className="text-primary">Galeri:</strong> {settings.gallery.images.length} item</div>
                <div><strong className="text-primary">Rekening:</strong> {settings.gift.accounts.length} item</div>
                <div><strong className="text-primary">Ucapan masuk:</strong> {wishes.length}</div>
              </div>
              <div className="mt-4 rounded-lg bg-surface-container-lowest p-3">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-secondary">Tema cepat</div>
                <div className="space-y-2 max-h-[280px] overflow-auto pr-1">{THEMES.map((t) => (
                  <button key={t.id} onClick={() => set("general", { ...settings.general, themeId: t.id })} className={`flex w-full items-center gap-2 rounded-lg p-2 text-left ${settings.general.themeId === t.id ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-surface-container"}`}>
                    <img src={t.image} alt="" className="h-10 w-12 rounded object-cover"/>
                    <span className="text-[11.5px] font-medium text-primary">{t.name}</span>
                  </button>
                ))}</div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

