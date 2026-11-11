import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, Copy, HeartHandshake, Loader2, MailOpen, MapPin, Pause, Play, Send } from "lucide-react";
import { ambient, type AudioMode } from "../lib/ambient";
import { guestNameFromUrl } from "../lib/event";
import { fetchPublishedInvitation, fetchWishes, insertWish, subscribeWishes, type InvitationSettingsRow, type Wish } from "../lib/supabase";
import { mergeSettings } from "../lib/invitationSettings";
import { getInviteTheme } from "../lib/inviteTheme";
import { cn } from "../utils/cn";

function mapEmbedSrc(value: string) {
  const v = (value || "").trim();
  if (!v) return "";
  const m = v.match(/src\s*=\s*["']([^"']+)["']/i);
  if (m?.[1]) return m[1].trim();
  return /^https?:\/\//i.test(v) ? v : "";
}

function useCountdown(iso: string) {
  const target = useMemo(() => { const t = Date.parse(iso); return Number.isFinite(t) ? t : Date.now() + 30 * 86400000; }, [iso]);
  const calc = useCallback(() => {
    const dist = Math.max(0, target - Date.now());
    return { d: Math.floor(dist / 86400000), h: Math.floor((dist % 86400000) / 3600000), m: Math.floor((dist % 3600000) / 60000), s: Math.floor((dist % 60000) / 1000) };
  }, [target]);
  const [t, setT] = useState(calc);
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, [calc]);
  return t;
}

export function PublicInvitePage({ slug }: { slug: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [row, setRow] = useState<InvitationSettingsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cover, setCover] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wishesSource, setWishesSource] = useState<"supabase" | "local">("local");
  const [sending, setSending] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const guest = useMemo(guestNameFromUrl, []);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null);
    void fetchPublishedInvitation(slug).then((res) => {
      if (!alive) return;
      if (res.row) setRow(res.row);
      else setError(res.error || "not_found");
      setLoading(false);
    });
    return () => { alive = false; };
  }, [slug]);

  const s = useMemo(() => mergeSettings(row?.settings, row?.title || ""), [row]);
  const t = useCountdown(s.event.countdownIso);
  const title = s.general.title || `${s.couple.groom.name} & ${s.couple.bride.name}`;
  const themeId = (row?.theme_id || s.general.themeId || "").trim();
  const theme = getInviteTheme(themeId);
  const isJawa = theme.key === "jawa";
  const defIslamicGreeting = /Assalamu|rahmat Allah SWT/i.test(s.content.greeting || "");
  const defIslamicClosing = /kehormatan dan kebahagiaan/i.test(s.content.closing || "");
  const defIslamicVerse = /Ar-Rum/i.test(s.content.verseSource || "") || /Az-Zariyat/i.test(s.content.verseSource || "") || /وَمِنْ ءَايَٰتِهِ/i.test(s.content.verseAr || "");
  const rawOpening = s.hero.openingText || "";
  const openingText = isJawa
    ? (rawOpening && rawOpening !== "The Wedding of" ? rawOpening : theme.opening)
    : (rawOpening || theme.opening);
  const greeting = isJawa && defIslamicGreeting ? "Kanthi nyuwun rahmat saha ridho Gusti Ingkang Maha Agung, kawula badhe hangayahi adicara pahargyan pawiwahan putra-putri kawula:" : s.content.greeting;
  const closing = isJawa && defIslamicClosing ? "Kanthi agunging panuwun, kawula ngaturaken matur nuwun awit rawuh lan donga pangestunipun panjenengan." : s.content.closing;
  const jawaVerse = { ar: "ꦲꦠꦱ꧀ ꦲꦱꦶꦃ ꦭꦤ꧀ ꦧꦼꦂꦏꦃ ꦒꦸꦱ꧀ꦠꦶ", text: "Mugi Gusti paring berkah, rahmat, saha katentreman dhateng kalih penganten, dados kulawarga ingkang sakinah, mawaddah, warahmah.", source: "Donga Pawiwahan Jawa" };
  const useJawaVerse = isJawa && defIslamicVerse;

  useEffect(() => {
    if (!row) return;
    const scope = { invitationId: row.id, slug };
    void fetchWishes(scope).then((r) => { setWishes(r.wishes); setWishesSource(r.source); });
    const unsub = subscribeWishes((w) => setWishes((p) => (p.some((x) => x.id === w.id) ? p : [w, ...p])), scope);
    return () => { unsub(); ambient.stop(); setPlaying(false); };
  }, [row, slug]);

  useEffect(() => {
    if (!row) return;
    if (playing) void ambient.start((s.audio.mode === "nature" ? 1 : s.audio.mode === "beat" ? 2 : 0) as AudioMode, s.audio.url);
  }, [s.audio.url, s.audio.mode]);

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600); };
  const toggleAudio = (force?: boolean) => {
    const next = force ?? !playing; setPlaying(next);
    if (next) void ambient.start((s.audio.mode === "nature" ? 1 : s.audio.mode === "beat" ? 2 : 0) as AudioMode, s.audio.url); else ambient.stop();
  };
  const openInvite = () => {
    setCover(false);
    toggleAudio(true);
    try {
      const el = document.documentElement as any;
      if (!document.fullscreenElement && el?.requestFullscreen) void el.requestFullscreen().catch(() => {});
      else if (!document.fullscreenElement && el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch {}
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };
  const copyText = async (text: string, label: string) => { try { await navigator.clipboard.writeText(text); notify(`${label} disalin.`); } catch { notify("Gagal menyalin."); } };
  const submitWish = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim(); const message = String(fd.get("message") ?? "").trim();
    if (!name || !message) return; setSending(true);
    const { wish, persisted } = await insertWish({ name, presence: String(fd.get("presence") ?? "Hadir"), message, theme: `${slug}:${s.general.themeId}`, invitationId: row?.id, slug });
    setSending(false); setWishes((p) => (p.some((x) => x.id === wish.id) ? p : [wish, ...p])); e.currentTarget.reset();
    notify(persisted === "supabase" ? "Ucapan tersimpan." : "Ucapan tersimpan lokal.");
  };

  if (loading) return <div className={cn("min-h-screen flex items-center justify-center text-white", theme.coverBg)}><Loader2 className="animate-spin"/></div>;
  if (error || !row) {
    const draft = error === "draft";
    const drift = error === "schema_drift";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6 text-center">
        <div className="max-w-md rounded-2xl bg-surface-container-low p-8 shadow-sm">
          <h1 className="font-headline text-[28px] text-primary">{draft ? "Undangan Belum Dipublikasikan" : "Undangan Tidak Ditemukan"}</h1>
          <p className="mt-3 text-[14px] leading-7 text-on-surface-variant">
            {draft ? <>Alamat <strong>/{slug}</strong> sudah terdaftar, tetapi status undangan masih <strong>draft</strong>. Masuk ke Setting ? ubah Status ke <strong>Published</strong> ? Simpan ke Supabase, lalu buka link lagi.</>
              : drift ? <>Alamat <strong>/{slug}</strong> terdeteksi tetapi data undangan belum dapat ditampilkan. Jalankan <code>supabase/schema.sql</code> terbaru dan pastikan status <strong>Published</strong>.</>
              : <>Alamat <strong>/{slug}</strong> tidak ditemukan. Pastikan <code>supabase/schema.sql</code> terbaru sudah dijalankan, slug ada di <code>public.invitation_settings.slug</code> (atau terhubung via <code>profiles.subdomain</code>), dan status <strong>Published</strong>. Coba juga <code>?invite={slug}</code>.</>}
          </p>
          <a href="/" className="mt-5 inline-block rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-on-primary">Ke Beranda</a>
        </div>
      </div>
    );
  }
  const images = (s.gallery.images || []).map((x) => (typeof x === "string" ? x : x?.url)).filter(Boolean) as string[];
  const showImages = s.privacy.hidePhotos ? [] : images.length ? images : ["/images/bride.jpg", "/images/groom.jpg", "/images/venue-masjid.jpg", "/images/gallery-1.jpg"];
  const patternClass = theme.pattern;
  const cardClass = theme.card;
  const accentStyle = { color: theme.accent } as const;
  const primaryStyle = { color: theme.primary } as const;

  return (
    <div className={cn("min-h-[100dvh] w-full text-white", theme.pageBg)}>
      {toast && <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-[12px] text-white">{toast}</div>}
      <div className="mx-auto flex min-h-[100dvh] w-full flex-col md:max-w-[980px] md:flex-row">
        <aside className="relative hidden w-full overflow-hidden md:sticky md:top-0 md:flex md:h-[100dvh] md:w-[52%] md:flex-col md:justify-end md:border-r md:border-white/10">
          <img src={s.hero.coverImageUrl || s.couple.groom.photoUrl || "/images/venue-masjid.jpg"} alt={title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,.12),rgba(10,10,10,.68)_55%,rgba(10,10,10,.92))]" />
          <div className={cn("absolute inset-0 opacity-20", patternClass)} />
          {isJawa && (
            <>
              <div className="absolute inset-0 opacity-[0.16] jawa-batik-parang mix-blend-soft-light pointer-events-none" />
              <div className="absolute left-0 right-0 top-0 jawa-batik-strip" />
              <div className="absolute left-0 right-0 bottom-0 jawa-batik-strip" />
              <div className="absolute inset-4 border border-[#c89b3c]/35 pointer-events-none" />
              <div className="jawa-corner left-5 top-5" />
              <div className="jawa-corner right-5 top-5 rotate-90" />
              <div className="jawa-corner bottom-5 left-5 -rotate-90" />
              <div className="jawa-corner bottom-5 right-5 rotate-180" />
            </>
          )}
          <div className="relative z-10 p-10 xl:p-14">
            <p className={cn("font-noto-serif text-[12px] uppercase tracking-[0.32em]", isJawa ? "text-[#ead7a1]" : "text-[#f3d98b]/90")}>{openingText}</p>
            <h1 className="mt-3 font-script text-[72px] leading-[0.95] text-white">{title}</h1>
            <div className={cn("mt-5 h-px w-36", isJawa ? "bg-gradient-to-r from-[#c89b3c] to-transparent" : "bg-gradient-to-r from-[#d4af37] to-transparent")} />
            <p className="mt-5 font-noto-serif text-[20px] text-white/92">{s.event.dateDisplay}</p>
            <p className="mt-3 max-w-md text-[13px] leading-6 text-white/70">Kepada Yth. <span className="font-semibold text-white">{guest}</span></p>
            <p className="mt-8 text-[10px] uppercase tracking-[0.22em] text-white/35">Skatim Invitation • /{slug}</p>
          </div>
        </aside>

        <div className={cn("relative min-h-[100dvh] w-full md:h-[100dvh] md:w-[48%] md:overflow-y-auto", theme.panelBg)}>
          <div className="relative min-h-[100dvh] w-full bg-[#fdfbf7]">
            <button onClick={() => toggleAudio()} aria-label="Audio" className={cn("fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/92 shadow-lg md:sticky md:left-auto md:ml-auto md:mr-4 md:top-4")} style={{ color: playing ? theme.accent : theme.primary }}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
            <div ref={scrollRef} className={cn("min-h-[100dvh] overflow-x-hidden font-noto-sans", patternClass)} style={{ color: theme.text }}>
            <AnimatePresence>
              {cover && (
                <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, y: -30 }} className={cn("fixed inset-0 z-40 flex min-h-[100dvh] flex-col items-center justify-center px-6 py-12 text-center text-white md:left-auto md:right-0 md:w-[48%] md:max-w-none overflow-hidden", theme.coverBg)}>
                  {isJawa && (
                    <>
                      <div className="absolute inset-0 opacity-[0.22] jawa-batik-parang pointer-events-none" />
                      <div className="absolute inset-0 opacity-10 jawa-batik-kawung pointer-events-none" />
                      <div className="absolute left-0 right-0 top-0 jawa-batik-strip" />
                      <div className="absolute left-0 right-0 bottom-0 jawa-batik-strip" />
                      <div className="jawa-corner left-4 top-16" />
                      <div className="jawa-corner right-4 top-16 rotate-90" />
                      <div className="jawa-corner bottom-4 left-4 -rotate-90" />
                      <div className="jawa-corner bottom-4 right-4 rotate-180" />
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 jawa-ornament w-44 opacity-90" />
                      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 jawa-ornament w-44 opacity-70" />
                    </>
                  )}
                  <div className={cn("absolute inset-3 rounded-[24px] pointer-events-none", isJawa ? "border border-[#c89b3c]/40 outline outline-1 outline-[#c89b3c]/20 -outline-offset-8" : "border border-[#d4af37]/35")} />
                  <p className={cn("font-noto-serif text-[12px] tracking-[0.28em]", isJawa ? "text-[#ead7a1]" : "text-[#fed488]")}>{isJawa ? "PANGGIH PENGANTEN" : (s.hero.openingText || "THE WEDDING OF")}</p>
                  <h2 className="mt-4 font-script text-[56px] leading-none" style={{ color: theme.accentSoft }}>{title}</h2>
                  <div className={cn("my-5 opacity-80", theme.divider)} />
                  <p className="text-[11px] text-white/75">{isJawa ? "Katur Dhumateng Bapak/Ibu/Saudara/i" : "Kepada Yth. Bapak/Ibu/Saudara/i"}</p>
                  <p className="mt-1 font-noto-serif text-[20px] font-semibold">{guest}</p>
                  <button onClick={openInvite} className="mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[12px] font-bold tracking-wide shadow-lg" style={{ backgroundColor: theme.accent, color: theme.primary }}><MailOpen size={15} />{isJawa ? "Buka Pawiwahan" : "Buka Undangan"}</button>
                </motion.div>
              )}
            </AnimatePresence>

            <section className="relative flex min-h-[560px] flex-col items-center justify-center px-6 pb-10 pt-16 text-center overflow-hidden">
              {isJawa && <><div className="absolute left-0 right-0 top-0 jawa-batik-strip-thin opacity-70" /><div className="absolute -left-6 -top-6 h-28 w-28 rounded-full border border-[#c89b3c]/20 jawa-batik-kawung opacity-40" /><div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full border border-[#c89b3c]/20 jawa-batik-kawung opacity-40" /><div className="jawa-ornament w-44 opacity-70 mb-2" /></>}
              <p className="font-noto-serif text-[11px] uppercase tracking-[0.28em]" style={{ color: isJawa ? "#7a4a21" : "#775a19" }}>{openingText}</p>
              <h1 className="mt-3 font-script text-[62px] leading-[0.95]" style={primaryStyle}>{title}</h1>
              <div className={cn("my-5", theme.divider)} />
              <p className="font-noto-serif text-[18px] font-semibold" style={primaryStyle}>{s.event.dateDisplay}</p>
              <div className="mt-7 grid w-full max-w-[320px] grid-cols-4 gap-2">{([["Hari",t.d],["Jam",t.h],["Menit",t.m],["Detik",t.s]] as const).map(([k,v]) => (
                <div key={k} className={cn("rounded-xl py-2 shadow-sm", isJawa ? "border border-[#c89b3c]/30 bg-[#fffaf0]/80" : "border border-[#d4af37]/25 bg-white/75")}><div className="font-noto-serif text-[22px] font-semibold tabular" style={primaryStyle}>{String(v).padStart(2,"0")}</div><div className="text-[9px] uppercase tracking-[0.12em]" style={{ color: isJawa ? "#7a4a21" : "#775a19" }}>{k}</div></div>
              ))}</div>
            </section>

            {s.content.verseEnabled && <section className="px-6 py-10 text-center text-white" style={{ backgroundColor: theme.primary }}>
              <div className="mb-4 text-[34px] leading-none opacity-80 font-serif" style={{ color: theme.accent }}>{isJawa ? "ꦥꦒꦶꦃ" : "﷽"}</div>
              <p className="font-noto-serif text-[21px] leading-9" style={{ color: theme.accentSoft }}>{useJawaVerse ? jawaVerse.ar : s.content.verseAr}</p>
              <p className="mx-auto mt-4 max-w-[320px] text-[12px] leading-6 text-white/82">"{useJawaVerse ? jawaVerse.text : s.content.verseText}"</p>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.accent }}>({useJawaVerse ? jawaVerse.source : s.content.verseSource})</p>
            </section>}

            <section className="px-6 py-10">
              <h3 className="text-center font-script text-[42px]" style={primaryStyle}>{theme.coupleTitle}</h3>
              <div className={cn("my-4", theme.divider)} />
              <p className="mx-auto mb-7 max-w-[300px] text-center text-[12.5px] leading-6" style={{ color: theme.muted }}>{greeting}</p>
              <div className="space-y-8">
                {([s.couple.groom, s.couple.bride] as const).map((p, idx) => (
                  <div key={idx} className="text-center">
                    {!s.privacy.hidePhotos && <div className={cn("mx-auto h-36 w-36 overflow-hidden rounded-full p-1 shadow-md", isJawa ? "border-4 border-[#c89b3c]/35" : "border-4 border-[#d4af37]/25")}><img src={p.photoUrl || (idx ? "/images/bride.jpg" : "/images/groom.jpg")} alt={p.name} className="h-full w-full rounded-full object-cover" /></div>}
                    <h4 className="mt-4 font-noto-serif text-[28px] font-semibold" style={primaryStyle}>{p.name}</h4>
                    <p className="mt-1 font-noto-serif text-[12.5px] font-semibold" style={primaryStyle}>{[p.childOrder, p.father && `Bpk. ${p.father}`.replace(/^Bpk\. Bpk\./,'Bpk.'), p.mother && `Ibu ${p.mother}`.replace(/^Ibu Ibu/,'Ibu')].filter(Boolean).join(" dari ")}</p>
                    {idx === 0 && <div className="mt-6 text-center font-script text-[44px]" style={accentStyle}>&amp;</div>}
                  </div>
                ))}
              </div>
            </section>

            <section className={cn("px-6 py-10", isJawa ? "bg-[#fffaf0]/60" : "bg-white/60") }>
              <h3 className="text-center font-script text-[42px]" style={primaryStyle}>{theme.eventTitle}</h3>
              <div className={cn("my-4", theme.divider)} />
              <div className="space-y-4">{s.event.events.map((ev, i) => (
                <div key={i} className={cn("rounded-xl p-5 text-center shadow-sm", theme.frame, cardClass)}>
                  {ev.type === "akad" ? <HeartHandshake className="mx-auto mb-2" style={{ color: isJawa ? "#7a4a21" : "#775a19" }} size={20} /> : <Calendar className="mx-auto mb-2" style={{ color: isJawa ? "#7a4a21" : "#775a19" }} size={20} />}
                  <h4 className="font-noto-serif text-[24px] font-bold" style={primaryStyle}>{ev.title}</h4>
                  <p className="mt-2 text-[12.5px] font-semibold">{ev.date || s.event.dateDisplay}</p>
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-[12px]" style={{ color: theme.muted }}><Clock size={13} />{ev.start}{ev.end ? ` - ${ev.end}` : ""}</p>
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-[12px]" style={{ color: theme.muted }}><MapPin size={13} />{ev.venue}{ev.address ? `, ${ev.address}` : ""}</p>
                  {ev.mapUrl && <a href={ev.mapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block rounded-full px-4 py-2 text-[11px] font-semibold" style={{ border: `1px solid ${theme.primary}`, color: theme.primary }}>Buka Lokasi</a>}
                </div>
              ))}</div>
            </section>

            {(s.location.mapEmbedUrl || s.location.mapLink || s.location.primaryAddress) && <section className="px-6 py-10 text-center">
              <h3 className="font-script text-[42px]" style={primaryStyle}>{isJawa ? "Papan Panggih" : "Lokasi Acara"}</h3>
              <div className={cn("my-4", theme.divider)} />
              <div className={cn("overflow-hidden rounded-2xl shadow-sm", cardClass, isJawa ? "border border-[#c89b3c]/30" : "border border-[#d4af37]/25")}>
                {mapEmbedSrc(s.location.mapEmbedUrl) ? <iframe title="Peta" src={mapEmbedSrc(s.location.mapEmbedUrl)} className="aspect-video w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : <div className="flex aspect-video items-center justify-center bg-[#efeeeb] px-4 text-[12px]" style={{ color: theme.muted }}>{s.location.primaryAddress || "Lokasi acara"}</div>}
                <div className="p-4">
                  <p className="font-noto-serif text-[15px] font-semibold" style={primaryStyle}>{s.location.primaryAddress || "Lokasi Acara"}</p>
                  {s.location.mapLink && <a href={s.location.mapLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold text-white" style={{ backgroundColor: theme.primary }}><MapPin size={13} />Petunjuk Arah</a>}
                </div>
              </div>
            </section>}

            {s.gallery.enabled && showImages.length > 0 && <section className="px-5 py-10 text-white" style={{ backgroundColor: theme.galleryBg }}>
              <h3 className="text-center font-script text-[42px]" style={{ color: theme.accentSoft }}>{theme.galleryTitle}</h3>
              <div className={cn("my-4 opacity-70", theme.divider)} />
              <div className="grid grid-cols-2 gap-2">{showImages.map((src, i) => (
                <button key={src + i} onClick={() => setSelected(i)} className={cn("overflow-hidden rounded-xl ring-1 ring-white/10", i % 3 === 0 ? "row-span-2" : "")}><img src={src} alt="Galeri" className="h-full min-h-[92px] w-full object-cover" /></button>
              ))}</div>
            </section>}

            {s.rsvp.enabled && <section className="px-6 py-10">
              <h3 className="text-center font-script text-[42px]" style={primaryStyle}>{isJawa ? "Donga & Pangestu" : "RSVP & Ucapan"}</h3>
              <div className={cn("my-4", theme.divider)} />
              <p className="mb-4 text-center text-[10px] uppercase tracking-[0.14em]" style={{ color: theme.muted }}>Sumber: {wishesSource === "supabase" ? "Supabase realtime" : "Fallback lokal"}</p>
              <form onSubmit={submitWish} className={cn("space-y-2.5 rounded-2xl p-4 shadow-sm", cardClass, isJawa ? "ring-1 ring-[#c89b3c]/20" : "ring-1 ring-[#d4af37]/15")}>
                <input name="name" required maxLength={60} defaultValue={guest !== "Tamu Undangan" ? guest : ""} placeholder="Nama Lengkap" className="w-full rounded-xl border bg-white px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: `${theme.primary}1f` }} />
                <select name="presence" className="w-full rounded-xl border bg-white px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: `${theme.primary}1f` }}>{(s.rsvp.presenceOptions.length ? s.rsvp.presenceOptions : ["Hadir","Tidak Hadir","Masih Ragu"]).map((o) => <option key={o} value={o}>{o}</option>)}</select>
                <textarea name="message" required rows={3} maxLength={500} placeholder={isJawa ? "Sampaikan donga lan pangestu" : "Berikan ucapan & doa restu"} className="w-full resize-none rounded-xl border bg-white px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: `${theme.primary}1f` }} />
                <button type="submit" disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white disabled:opacity-70" style={{ backgroundColor: theme.primary }}>{sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}Kirim Ucapan</button>
              </form>
              <div className="mt-4 max-h-[260px] space-y-2 overflow-y-auto pr-1">{wishes.slice(0, 20).map((w) => (
                <div key={w.id} className={cn("rounded-xl border-l-4 p-3 shadow-sm", cardClass)} style={{ borderLeftColor: theme.accent }}><div className="flex items-center justify-between gap-2"><strong className="text-[12.5px]" style={primaryStyle}>{w.name}</strong><span className="rounded-full px-2 py-0.5 text-[8px] font-bold uppercase" style={{ backgroundColor: `${theme.primary}14`, color: isJawa ? "#7a4a21" : "#775a19" }}>{w.presence}</span></div><p className="mt-1 text-[12px] leading-5" style={{ color: theme.muted }}>{w.message}</p></div>
              ))}</div>
            </section>}

            {s.gift.enabled && s.gift.accounts.length > 0 && <section className={cn("px-6 py-10 text-center", isJawa ? "bg-[#fffaf0]/55" : "bg-white/55") }>
              <h3 className="font-script text-[42px]" style={primaryStyle}>{isJawa ? "Tandha Asih" : "Tanda Kasih"}</h3>
              <div className={cn("my-4", theme.divider)} />
              <p className="mx-auto mb-5 max-w-[300px] text-[12.5px] leading-6" style={{ color: theme.muted }}>{s.gift.note}</p>
              <div className="space-y-3">{s.gift.accounts.map((b, i) => (
                <div key={i} className={cn("rounded-2xl p-4 shadow-sm", cardClass, isJawa ? "border border-[#c89b3c]/30" : "border border-[#d4af37]/25")}><div className="text-[18px] font-bold tracking-[0.18em]" style={primaryStyle}>{b.bank}</div><div className="mt-1 font-noto-serif text-[20px] tracking-wider" style={primaryStyle}>{b.number}</div><div className="text-[11px]" style={{ color: theme.muted }}>{b.name}</div><button onClick={() => void copyText(b.number, `Nomor ${b.bank}`)} className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ backgroundColor: `${theme.primary}10`, color: theme.primary }}><Copy size={12} />Salin Nomor</button></div>
              ))}</div>
            </section>}

            <footer className={cn("relative px-6 py-10 text-center overflow-hidden", isJawa ? "jawa-batik-kawung" : "text-white")} style={{ backgroundColor: isJawa ? "#f3ead8" : theme.footerBg }}>
              {isJawa && <><div className="absolute left-0 right-0 top-0 jawa-batik-strip-thin opacity-70" /><div className="jawa-ornament w-36 opacity-60 mx-auto mb-2" /></>}
              <h3 className="font-script text-[46px]" style={{ color: isJawa ? theme.primary : theme.accent }}>{title}</h3>
              <p className="mx-auto mt-3 max-w-[300px] text-[11.5px] leading-6" style={{ color: isJawa ? "#5c4033" : "rgba(255,255,255,0.8)" }}>{closing}</p>
              {isJawa && <p className="mt-3 text-[12px] tracking-[0.08em] font-medium" style={{ color: "#5c4033" }}>Mugi pinaringan berkah rahayu selaminipun</p>}
              <p className="mt-8 text-[9px] uppercase tracking-[0.2em]" style={{ color: isJawa ? "#5c4033" : "rgba(255,255,255,0.35)" }}>Skatim Invitation • /{slug}</p>
            </footer>

            <AnimatePresence>{selected !== null && showImages[selected] && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><img src={showImages[selected]} alt="Galeri" className="max-h-full w-full max-w-[430px] rounded-2xl object-contain" /></motion.button>
            )}</AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
