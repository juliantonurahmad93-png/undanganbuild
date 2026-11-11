import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, Copy, HeartHandshake, Loader2, MailOpen, MapPin, Pause, Play, Send, X } from "lucide-react";
import { Modal } from "../ui/Modal";
import { useUi } from "../../lib/ui";
import { ambient, AUDIO_MODES, type AudioMode } from "../../lib/ambient";
import { getInviteTheme } from "../../lib/inviteTheme";
import { guestNameFromUrl } from "../../lib/event";
import { fetchWishes, insertWish, subscribeWishes, type Wish } from "../../lib/supabase";
import { cn } from "../../utils/cn";

const guestName = guestNameFromUrl();

function useCountdown() {
  const target = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setHours(8, 0, 0, 0);
    return d.getTime();
  }, []);
  const calc = useCallback(() => {
    const dist = Math.max(0, target - Date.now());
    return {
      d: Math.floor(dist / 86400000),
      h: Math.floor((dist % 86400000) / 3600000),
      m: Math.floor((dist % 3600000) / 60000),
      s: Math.floor((dist % 60000) / 1000),
    };
  }, [target]);
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return { t, targetDate: new Date(target) };
}

const BANKS = [
  { bank: "BCA", number: "1234567890", name: "a.n. Rizky Ramadhan" },
  { bank: "Mandiri", number: "0987654321", name: "a.n. Aisyah Putri" },
];

export function LiveDemoModal() {
  const { modal, closeModal, demoTheme, toast } = useUi();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cover, setCover] = useState(true);
  const [mode] = useState<AudioMode>(0);
  const [playing, setPlaying] = useState(false);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wishesSource, setWishesSource] = useState<"supabase" | "local">("local");
  const [sending, setSending] = useState(false);
  const [loadingWishes, setLoadingWishes] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const { t, targetDate } = useCountdown();
  const theme = getInviteTheme(demoTheme);
  const rich = theme.key === "islami" || theme.key === "jawa";
  const isJawa = theme.key === "jawa";
  const dateText = targetDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const load = useCallback(async () => {
    setLoadingWishes(true);
    const { wishes: list, source } = await fetchWishes({ slug: "demo" });
    setWishes(list);
    setWishesSource(source);
    setLoadingWishes(false);
  }, []);

  useEffect(() => {
    if (modal !== "demo") return;
    setCover(true);
    setSelected(null);
    void load();
    const unsub = subscribeWishes((wish) => setWishes((prev) => (prev.some((w) => w.id === wish.id) ? prev : [wish, ...prev])), { slug: "demo" });
    scrollRef.current?.scrollTo({ top: 0 });
    return () => {
      unsub();
      ambient.stop();
      setPlaying(false);
    };
  }, [modal, load, demoTheme]);

  const toggleAudio = (forceOn?: boolean) => {
    const next = forceOn ?? !playing;
    setPlaying(next);
    if (next) {
      ambient.start(mode);
      if (!forceOn) toast(`Audio: ${AUDIO_MODES[mode].label}`);
    } else ambient.stop();
  };

  const openInvite = () => {
    setCover(false);
    toggleAudio(true);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`${label} disalin.`);
    } catch {
      toast("Gagal menyalin. Salin manual.", false);
    }
  };

  const submitWish = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();
    if (!name || !message) return;
    setSending(true);
    const { wish, persisted } = await insertWish({ name, presence: String(fd.get("presence") ?? "Hadir"), message, theme: `demo:${demoTheme}`, slug: "demo" });
    setSending(false);
    setWishes((prev) => (prev.some((w) => w.id === wish.id) ? prev : [wish, ...prev]));
    form.reset();
    toast(persisted === "supabase" ? "Ucapan tersimpan ke Supabase." : "Ucapan tersimpan lokal (fallback).", persisted === "supabase");
  };

  const images = ["/images/bride.jpg", "/images/groom.jpg", "/images/venue-masjid.jpg", "/images/gallery-1.jpg", "/images/venue-ballroom.jpg", "/images/gallery-2.jpg"];

  return (
    <Modal open={modal === "demo"} onClose={closeModal} maxWidth="max-w-[430px]" bare>
      <div className={cn("relative mx-auto flex h-[min(90vh,920px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[38px] p-2.5 shadow-phone", isJawa ? "bg-[#2a1d14]" : "bg-[#1b2f28]")}>
        <div className="absolute right-4 top-4 z-50 flex gap-2">
          <button onClick={() => toggleAudio()} aria-label="Audio" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/92 shadow-lg" style={{ color: playing ? theme.accent : theme.primary }}>{playing ? <Pause size={14} /> : <Play size={14} />}</button>
          <button onClick={closeModal} aria-label="Tutup" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/92 shadow-lg" style={{ color: theme.primary }}><X size={15} /></button>
        </div>
        <div ref={scrollRef} className={cn("relative flex-1 overflow-y-auto overflow-x-hidden rounded-[30px] scroll-smooth font-noto-sans", rich ? theme.pattern : "bg-surface-container-lowest text-on-surface")} style={rich ? { color: theme.text } : undefined}>
          {rich ? (
            <>
              <AnimatePresence>
                {cover && (
                  <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, y: -30 }} className={cn("absolute inset-0 z-40 flex min-h-full flex-col items-center justify-center px-6 py-12 text-center text-white", theme.coverBg)}>
                    <div className={cn("absolute inset-3 rounded-[24px] pointer-events-none", isJawa ? "border border-[#c89b3c]/40 outline outline-1 outline-[#c89b3c]/20 -outline-offset-8" : "border border-[#d4af37]/35")} />
                    {isJawa && (
                      <>
                        <div className="absolute inset-0 opacity-[0.22] jawa-batik-parang pointer-events-none" />
                        <div className="absolute inset-0 opacity-10 jawa-batik-kawung pointer-events-none" />
                        <div className="absolute left-0 right-0 top-0 jawa-batik-strip" />
                        <div className="absolute left-0 right-0 bottom-0 jawa-batik-strip" />
                        <div className="jawa-corner left-3 top-14" />
                        <div className="jawa-corner right-3 top-14 rotate-90" />
                        <div className="jawa-corner bottom-3 left-3 -rotate-90" />
                        <div className="jawa-corner bottom-3 right-3 rotate-180" />
                        <div className="absolute top-11 left-1/2 -translate-x-1/2 jawa-ornament w-40 opacity-90" />
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 jawa-ornament w-40 opacity-70" />
                      </>
                    )}
                    <p className={cn("font-noto-serif text-[12px] tracking-[0.28em]", isJawa ? "text-[#ead7a1]" : "text-[#fed488]")}>{isJawa ? "PANGGIH PENGANTEN" : "THE WEDDING OF"}</p>
                    <h2 className="mt-4 font-script text-[56px] leading-none" style={{ color: theme.accentSoft }}>Rizky &amp; Aisyah</h2>
                    <div className={cn("my-5 opacity-80", theme.divider)} />
                    <p className="text-[11px] text-white/75">{isJawa ? "Katur Dhumateng Bapak/Ibu/Saudara/i" : "Kepada Yth. Bapak/Ibu/Saudara/i"}</p>
                    <p className="mt-1 font-noto-serif text-[20px] font-semibold">{guestName}</p>
                    <p className="mt-6 max-w-[260px] text-[11px] leading-5 text-white/60">{isJawa ? "Nyuwun agunging pangapunten menawi wonten klenta-klentunipun panyebat asma/dalem" : "Mohon maaf apabila ada kesalahan penulisan nama/gelar"}</p>
                    <button onClick={openInvite} className="mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[12px] font-bold tracking-wide shadow-lg" style={{ backgroundColor: theme.accent, color: theme.primary }}><MailOpen size={15} />{isJawa ? "Buka Pawiwahan" : "Buka Undangan"}</button>
                  </motion.div>
                )}
              </AnimatePresence>

              <section className="relative flex min-h-[520px] flex-col items-center justify-center px-6 pb-10 pt-14 text-center overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,rgba(200,155,60,.14),transparent_70%)]" />
                {isJawa && <><div className="absolute left-0 right-0 top-0 jawa-batik-strip-thin opacity-70" /><div className="absolute -left-5 -top-5 h-24 w-24 rounded-full jawa-batik-kawung opacity-35" /><div className="absolute -right-5 -bottom-5 h-24 w-24 rounded-full jawa-batik-kawung opacity-35" /><div className="jawa-ornament w-40 opacity-70 mb-2" /></>}
                <p className="font-noto-serif text-[11px] uppercase tracking-[0.28em]" style={{ color: isJawa ? "#7a4a21" : "#775a19" }}>{isJawa ? "Panggih Penganten" : "The Wedding of"}</p>
                <h1 className="mt-3 font-script text-[62px] leading-[0.95]" style={{ color: theme.primary }}>Rizky &amp; Aisyah</h1>
                <div className={cn("my-5", theme.divider)} />
                <p className="font-noto-serif text-[18px] font-semibold" style={{ color: theme.primary }}>{dateText}</p>
                <div className="mt-7 grid w-full max-w-[320px] grid-cols-4 gap-2">
                  {[["Hari", t.d], ["Jam", t.h], ["Menit", t.m], ["Detik", t.s]].map(([k, v]) => (
                    <div key={k} className={cn("rounded-xl py-2 shadow-sm", isJawa ? "border border-[#c89b3c]/30 bg-[#fffaf0]/80" : "border border-[#d4af37]/25 bg-white/75")}>
                      <div className="font-noto-serif text-[22px] font-semibold tabular" style={{ color: theme.primary }}>{String(v).padStart(2, "0")}</div>
                      <div className="text-[9px] uppercase tracking-[0.12em]" style={{ color: isJawa ? "#7a4a21" : "#775a19" }}>{k}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 max-w-[280px] font-noto-serif text-[13px] italic leading-6" style={{ color: theme.muted }}>{isJawa ? "Mugi tansah pinaringan berkah, rahmat, lan katentreman ing bebrayan." : "“Dan di antara tanda-tanda kekuasaan-Nya...”"}</p>
              </section>

              <section className="px-6 py-10 text-center text-white" style={{ backgroundColor: theme.primary }}>
                <div className="mb-4 text-[34px] leading-none opacity-80 font-serif" style={{ color: theme.accent }}>{isJawa ? "ꦥꦒꦶꦃ" : "﷽"}</div>
                {isJawa ? (
                  <>
                    <p className="font-noto-serif text-[20px] leading-9" style={{ color: theme.accentSoft }}>Atas asih lan berkah Gusti Ingkang Maha Agung</p>
                    <p className="mx-auto mt-4 max-w-[320px] text-[12px] leading-6 text-white/82">Kanthi nyuwun rahmat saha ridho Gusti, kawula badhe hangayahi adicara pahargyan pawiwahan. Mugi dados kulawarga ingkang sakinah, mawaddah, warahmah.</p>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.accent }}>Adat Jawa Klasik</p>
                  </>
                ) : (
                  <>
                    <p className="font-noto-serif text-[21px] leading-9" style={{ color: theme.accentSoft }}>وَمِنْ ءَايَٰتِهِۦٓ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًا</p>
                    <p className="mx-auto mt-4 max-w-[320px] text-[12px] leading-6 text-white/82">"Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang."</p>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.accent }}>(QS. Ar-Rum: 21)</p>
                  </>
                )}
              </section>

              <section className="px-6 py-10">
                <h3 className="text-center font-script text-[42px]" style={{ color: theme.primary }}>Mempelai</h3>
                <div className={cn("my-4", theme.divider)} />
                <p className="mx-auto mb-7 max-w-[300px] text-center text-[12.5px] leading-6" style={{ color: theme.muted }}>{isJawa ? "Kanthi raos suka bagya, kawula ngaturi rawuh panjenengan wonten ing pahargyan pawiwahan:" : "Assalamu’alaikum Warahmatullahi Wabarakatuh. Dengan memohon rahmat Allah SWT, kami bermaksud menyelenggarakan pernikahan:"}</p>
                <div className="space-y-8">
                  <div className="text-center">
                    <div className={cn("mx-auto h-36 w-36 overflow-hidden rounded-full p-1 shadow-md", isJawa ? "border-4 border-[#c89b3c]/35" : "border-4 border-[#d4af37]/25")}><img src="/images/groom.jpg" alt="Mempelai pria" className="h-full w-full rounded-full object-cover" /></div>
                    <h4 className="mt-4 font-noto-serif text-[28px] font-semibold" style={{ color: theme.primary }}>Rizky Ramadhan</h4>
                    <p className="mt-1 font-noto-serif text-[12.5px] font-semibold" style={{ color: theme.primary }}>Putra dari Bpk. Fulan &amp; Ibu Fulanah</p>
                    <p className="mt-1 text-[11px]" style={{ color: theme.muted }}>Jakarta, Indonesia</p>
                  </div>
                  <div className="text-center font-script text-[44px]" style={{ color: theme.accent }}>&amp;</div>
                  <div className="text-center">
                    <div className={cn("mx-auto h-36 w-36 overflow-hidden rounded-full p-1 shadow-md", isJawa ? "border-4 border-[#c89b3c]/35" : "border-4 border-[#d4af37]/25")}><img src="/images/bride.jpg" alt="Mempelai wanita" className="h-full w-full rounded-full object-cover" /></div>
                    <h4 className="mt-4 font-noto-serif text-[28px] font-semibold" style={{ color: theme.primary }}>Aisyah Putri</h4>
                    <p className="mt-1 font-noto-serif text-[12.5px] font-semibold" style={{ color: theme.primary }}>Putri dari Bpk. Fulan &amp; Ibu Fulanah</p>
                    <p className="mt-1 text-[11px]" style={{ color: theme.muted }}>Bandung, Indonesia</p>
                  </div>
                </div>
              </section>

              <section className={cn("px-6 py-10", isJawa ? "bg-[#fffaf0]/60" : "bg-white/60")}>
                <h3 className="text-center font-script text-[42px]" style={{ color: theme.primary }}>Rangkaian Acara</h3>
                <div className={cn("my-4", theme.divider)} />
                <div className="space-y-4">
                  {(isJawa
                    ? [
                        { title: "Akad Nikah", time: "08.00 WIB - 10.00 WIB", loc: "Pendopo Ageng, Yogyakarta", icon: HeartHandshake },
                        { title: "Panggih / Resepsi", time: "11.00 WIB - 13.00 WIB", loc: "Pendopo Ageng, Yogyakarta", icon: Calendar },
                      ]
                    : [
                        { title: "Akad Nikah", time: "08.00 WIB - 10.00 WIB", loc: "Masjid Istiqlal, Jakarta", icon: HeartHandshake },
                        { title: "Resepsi", time: "11.00 WIB - 13.00 WIB", loc: "Grand Ballroom Hotel, Jakarta", icon: Calendar },
                      ]).map((ev) => (
                    <div key={ev.title} className={cn("rounded-xl p-5 text-center shadow-sm", theme.frame, theme.card)}>
                      <ev.icon className="mx-auto mb-2" style={{ color: isJawa ? "#7a4a21" : "#775a19" }} size={20} />
                      <h4 className="font-noto-serif text-[24px] font-bold" style={{ color: theme.primary }}>{ev.title}</h4>
                      <p className="mt-2 text-[12.5px] font-semibold">{dateText}</p>
                      <p className="mt-1 flex items-center justify-center gap-1.5 text-[12px]" style={{ color: theme.muted }}><Clock size={13} />{ev.time}</p>
                      <p className="mt-1 flex items-center justify-center gap-1.5 text-[12px]" style={{ color: theme.muted }}><MapPin size={13} />{ev.loc}</p>
                      <button onClick={() => toast("Contoh: buka Google Calendar / Maps.")} className="mt-4 rounded-full px-4 py-2 text-[11px] font-semibold" style={{ border: `1px solid ${theme.primary}`, color: theme.primary }}>Simpan / Buka Lokasi</button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="px-6 py-10 text-center">
                <h3 className="font-script text-[42px]" style={{ color: theme.primary }}>Lokasi Acara</h3>
                <div className={cn("my-4", theme.divider)} />
                <div className={cn("overflow-hidden rounded-2xl shadow-sm", theme.card, isJawa ? "border border-[#c89b3c]/30" : "border border-[#d4af37]/25")}>
                  <div className="flex aspect-video items-center justify-center bg-[#efeeeb] px-4 text-[12px]" style={{ color: theme.muted }}>Peta Google Maps dapat disematkan dari data lokasi acara.</div>
                  <div className="p-4">
                    <p className="font-noto-serif text-[15px] font-semibold" style={{ color: theme.primary }}>{isJawa ? "Pendopo Ageng, Yogyakarta" : "Masjid Istiqlal / Hotel Ballroom"}</p>
                    <button onClick={() => toast("Contoh: buka Google Maps.")} className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold text-white" style={{ backgroundColor: theme.primary }}><MapPin size={13} />Petunjuk Arah</button>
                  </div>
                </div>
              </section>

              <section className="px-5 py-10 text-white" style={{ backgroundColor: theme.galleryBg }}>
                <h3 className="text-center font-script text-[42px]" style={{ color: theme.accentSoft }}>Galeri Momen</h3>
                <div className={cn("my-4 opacity-70", theme.divider)} />
                <div className="grid grid-cols-2 gap-2">
                  {images.map((src, i) => (
                    <button key={src} onClick={() => setSelected(i)} className={cn("overflow-hidden rounded-xl ring-1 ring-white/10", i % 3 === 0 ? "row-span-2" : "")}>
                      <img src={src} alt="Galeri" className="h-full min-h-[92px] w-full object-cover" />
                    </button>
                  ))}
                </div>
              </section>

              <section className="px-6 py-10">
                <h3 className="text-center font-script text-[42px]" style={{ color: theme.primary }}>RSVP & Ucapan</h3>
                <div className={cn("my-4", theme.divider)} />
                <p className="mb-4 text-center text-[10px] uppercase tracking-[0.14em]" style={{ color: theme.muted }}>Sumber: {wishesSource === "supabase" ? "Supabase realtime" : "Fallback lokal"}</p>
                <form onSubmit={submitWish} className={cn("space-y-2.5 rounded-2xl p-4 shadow-sm", theme.card, isJawa ? "ring-1 ring-[#c89b3c]/20" : "ring-1 ring-[#d4af37]/15")}>
                  <input name="name" required maxLength={60} placeholder="Nama Lengkap" className="w-full rounded-xl border bg-white px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: `${theme.primary}1f` }} />
                  <select name="presence" className="w-full rounded-xl border bg-white px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: `${theme.primary}1f` }}><option value="Hadir">Hadir</option><option value="Tidak Hadir">Tidak Hadir</option><option value="Masih Ragu">Masih Ragu</option></select>
                  <textarea name="message" required rows={3} maxLength={500} placeholder={isJawa ? "Sampaikan donga lan pangestu" : "Berikan ucapan & doa restu"} className="w-full resize-none rounded-xl border bg-white px-3.5 py-2.5 text-[13px] outline-none" style={{ borderColor: `${theme.primary}1f` }} />
                  <button type="submit" disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white disabled:opacity-70" style={{ backgroundColor: theme.primary }}>{sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}Kirim Ucapan</button>
                </form>
                <div className="mt-4 max-h-[220px] space-y-2 overflow-y-auto pr-1">
                  {loadingWishes ? <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin" style={{ color: theme.primary }} /></div> : wishes.slice(0, 12).map((w) => (
                    <div key={w.id} className={cn("rounded-xl border-l-4 p-3 shadow-sm", theme.card)} style={{ borderLeftColor: theme.accent }}>
                      <div className="flex items-center justify-between gap-2"><strong className="text-[12.5px]" style={{ color: theme.primary }}>{w.name}</strong><span className="rounded-full px-2 py-0.5 text-[8px] font-bold uppercase" style={{ backgroundColor: `${theme.primary}14`, color: isJawa ? "#7a4a21" : "#775a19" }}>{w.presence}</span></div>
                      <p className="mt-1 text-[12px] leading-5" style={{ color: theme.muted }}>{w.message}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className={cn("px-6 py-10 text-center", isJawa ? "bg-[#fffaf0]/55" : "bg-white/55")}>
                <h3 className="font-script text-[42px]" style={{ color: theme.primary }}>{isJawa ? "Tandha Asih" : "Tanda Kasih"}</h3>
                <div className={cn("my-4", theme.divider)} />
                <p className="mx-auto mb-5 max-w-[300px] text-[12.5px] leading-6" style={{ color: theme.muted }}>{isJawa ? "Donga pangestu panjenengan dados berkah ingkang ageng. Menawi kersa paring tandha asih, saged lumantar:" : "Doa restu Anda merupakan karunia terindah. Namun jika memberi adalah ungkapan tanda kasih, dapat melalui:"}</p>
                <div className="space-y-3">
                  {BANKS.map((b) => (
                    <div key={b.number} className={cn("rounded-2xl p-4 shadow-sm", theme.card, isJawa ? "border border-[#c89b3c]/30" : "border border-[#d4af37]/25")}>
                      <div className="text-[18px] font-bold tracking-[0.18em]" style={{ color: theme.primary }}>{b.bank}</div>
                      <div className="mt-1 font-noto-serif text-[20px] tracking-wider" style={{ color: theme.primary }}>{b.number}</div>
                      <div className="text-[11px]" style={{ color: theme.muted }}>{b.name}</div>
                      <button onClick={() => void copyText(b.number, `Nomor ${b.bank}`)} className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ backgroundColor: `${theme.primary}10`, color: theme.primary }}><Copy size={12} />Salin Nomor</button>
                    </div>
                  ))}
                </div>
              </section>

              <footer className="px-6 py-10 text-center text-white" style={{ backgroundColor: theme.footerBg }}>
                <h3 className="font-script text-[46px]" style={{ color: theme.accent }}>Rizky &amp; Aisyah</h3>
                <p className="mx-auto mt-3 max-w-[300px] text-[11.5px] leading-6" style={{ color: isJawa ? "#5c4033" : "rgba(255,255,255,0.9)" }}>{isJawa ? "Kanthi agunging panuwun, kawula ngaturaken matur nuwun awit rawuh lan donga pangestunipun panjenengan." : "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu."}</p>
                <p className="mt-5 font-noto-serif text-[13px] leading-6 font-medium" style={{ color: isJawa ? "#5c4033" : theme.accentSoft }}>{isJawa ? "Mugi pinaringan berkah rahayu selaminipun" : "Wassalamu’alaikum Warahmatullahi Wabarakatuh"}</p>
                <p className="mt-8 text-[9px] uppercase tracking-[0.2em] text-white/35">Skatim Invitation Demo • {isJawa ? "Tema Adat Jawa" : "Tema Islami"}</p>
              </footer>

              <AnimatePresence>
                {selected !== null && (
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <img src={images[selected]} alt="Galeri" className="max-h-full w-full rounded-2xl object-contain" />
                  </motion.button>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="p-6 pt-14 text-center">
              <h2 className="font-headline text-[28px] text-primary">Demo {demoTheme}</h2>
              <p className="mt-3 text-sm text-on-surface-variant">Pratinjau kaya sementara tersedia untuk tema Islami dan Adat Jawa. Pilih tema tersebut untuk melihat template lengkap.</p>
              <button onClick={closeModal} className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary">Tutup</button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
