import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, Copy, HeartHandshake, Loader2, MailOpen, MapPin, Pause, Play, Send, X } from "lucide-react";
import { Modal } from "../ui/Modal";
import { useUi } from "../../lib/ui";
import { ambient, AUDIO_MODES, type AudioMode } from "../../lib/ambient";
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

function islamiTheme(theme: string) {
  const v = theme.toLowerCase();
  return v.includes("islami") || v.includes("sakinah") || v.includes("emerald");
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
  const islami = islamiTheme(demoTheme);
  const dateText = targetDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });


  const load = useCallback(async () => {
    setLoadingWishes(true);
    const { wishes: list, source } = await fetchWishes();
    setWishes(list);
    setWishesSource(source);
    setLoadingWishes(false);
  }, []);

  useEffect(() => {
    if (modal !== "demo") return;
    setCover(true);
    setSelected(null);
    void load();
    const unsub = subscribeWishes((wish) => setWishes((prev) => (prev.some((w) => w.id === wish.id) ? prev : [wish, ...prev])));
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
    const { wish, persisted } = await insertWish({ name, presence: String(fd.get("presence") ?? "Hadir"), message, theme: demoTheme });
    setSending(false);
    setWishes((prev) => (prev.some((w) => w.id === wish.id) ? prev : [wish, ...prev]));
    form.reset();
    toast(persisted === "supabase" ? "Ucapan tersimpan ke Supabase." : "Ucapan tersimpan lokal (fallback).", persisted === "supabase");
  };

  const images = ["/images/bride.jpg", "/images/groom.jpg", "/images/venue-masjid.jpg", "/images/gallery-1.jpg", "/images/venue-ballroom.jpg", "/images/gallery-2.jpg"];

  return (
    <Modal open={modal === "demo"} onClose={closeModal} maxWidth="max-w-[430px]" bare>
      <div className="relative mx-auto flex h-[min(90vh,920px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[38px] bg-[#1b2f28] p-2.5 shadow-phone">
        <div className="absolute right-4 top-4 z-50 flex gap-2">
          <button onClick={() => toggleAudio()} aria-label="Audio" className={cn("flex h-8 w-8 items-center justify-center rounded-full bg-white/92 shadow-lg", playing ? "text-[#775a19]" : "text-[#325346]")}>{playing ? <Pause size={14} /> : <Play size={14} />}</button>
          <button onClick={closeModal} aria-label="Tutup" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/92 text-[#325346] shadow-lg"><X size={15} /></button>
        </div>
        <div ref={scrollRef} className={cn("relative flex-1 overflow-y-auto overflow-x-hidden rounded-[30px] scroll-smooth", islami ? "islami-pattern font-noto-sans text-[#325346]" : "bg-surface-container-lowest text-on-surface")}>
          {islami ? (
            <>
              <AnimatePresence>
                {cover && (
                  <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0, y: -30 }} className="absolute inset-0 z-40 flex min-h-full flex-col items-center justify-center bg-[#325346] px-6 py-12 text-center text-white">
                    <div className="absolute inset-3 rounded-[24px] border border-[#d4af37]/35 pointer-events-none" />
                    <p className="font-noto-serif text-[12px] tracking-[0.28em] text-[#fed488]">THE WEDDING OF</p>
                    <h2 className="mt-4 font-script text-[56px] leading-none text-[#f3d98b]">Rizky &amp; Aisyah</h2>
                    <div className="islami-divider my-5 opacity-80" />
                    <p className="text-[11px] text-white/75">Kepada Yth. Bapak/Ibu/Saudara/i</p>
                    <p className="mt-1 font-noto-serif text-[20px] font-semibold">{guestName}</p>
                    <p className="mt-6 max-w-[260px] text-[11px] leading-5 text-white/60">Mohon maaf apabila ada kesalahan penulisan nama/gelar</p>
                    <button onClick={openInvite} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#d4af37] px-6 py-3 text-[12px] font-bold tracking-wide text-[#325346] shadow-lg"><MailOpen size={15} />Buka Undangan</button>
                  </motion.div>
                )}
              </AnimatePresence>

              <section className="flex min-h-[520px] flex-col items-center justify-center px-6 pb-10 pt-14 text-center">
                <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,rgba(212,175,55,.18),transparent_70%)]" />
                <p className="font-noto-serif text-[11px] uppercase tracking-[0.28em] text-[#775a19]">The Wedding of</p>
                <h1 className="mt-3 font-script text-[62px] leading-[0.95] text-[#325346]">Rizky &amp; Aisyah</h1>
                <div className="islami-divider my-5" />
                <p className="font-noto-serif text-[18px] font-semibold">{dateText}</p>
                <div className="mt-7 grid w-full max-w-[320px] grid-cols-4 gap-2">
                  {[["Hari", t.d], ["Jam", t.h], ["Menit", t.m], ["Detik", t.s]].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-[#d4af37]/25 bg-white/75 py-2 shadow-sm">
                      <div className="font-noto-serif text-[22px] font-semibold tabular text-[#325346]">{String(v).padStart(2, "0")}</div>
                      <div className="text-[9px] uppercase tracking-[0.12em] text-[#775a19]">{k}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 max-w-[280px] font-noto-serif text-[13px] italic leading-6 text-[#52695f]">"Dan di antara tanda-tanda kekuasaan-Nya..."</p>
              </section>

              <section className="bg-[#325346] px-6 py-10 text-center text-white">
                <div className="mb-4 text-[34px] leading-none text-[#d4af37] opacity-80 font-serif">﷽</div>
                <p className="font-noto-serif text-[21px] leading-9 text-[#f3d98b]">وَمِنْ ءَايَٰتِهِۦٓ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًا</p>
                <p className="mx-auto mt-4 max-w-[320px] text-[12px] leading-6 text-white/82">"Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang."</p>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#d4af37]">(QS. Ar-Rum: 21)</p>
              </section>

              <section className="px-6 py-10">
                <h3 className="text-center font-script text-[42px] text-[#325346]">Mempelai</h3>
                <div className="islami-divider my-4" />
                <p className="mx-auto mb-7 max-w-[300px] text-center text-[12.5px] leading-6 text-[#52695f]">Assalamu’alaikum Warahmatullahi Wabarakatuh. Dengan memohon rahmat Allah SWT, kami bermaksud menyelenggarakan pernikahan:</p>
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="mx-auto h-36 w-36 overflow-hidden rounded-full border-4 border-[#d4af37]/25 p-1 shadow-md"><img src="/images/groom.jpg" alt="Mempelai pria" className="h-full w-full rounded-full object-cover" /></div>
                    <h4 className="mt-4 font-script text-[38px] text-[#325346]">Rizky Ramadhan</h4>
                    <p className="mt-1 font-noto-serif text-[12.5px] font-semibold">Putra dari Bpk. Fulan &amp; Ibu Fulanah</p>
                    <p className="mt-1 text-[11px] text-[#52695f]">Jakarta, Indonesia</p>
                  </div>
                  <div className="text-center font-script text-[44px] text-[#d4af37]">&amp;</div>
                  <div className="text-center">
                    <div className="mx-auto h-36 w-36 overflow-hidden rounded-full border-4 border-[#d4af37]/25 p-1 shadow-md"><img src="/images/bride.jpg" alt="Mempelai wanita" className="h-full w-full rounded-full object-cover" /></div>
                    <h4 className="mt-4 font-script text-[38px] text-[#325346]">Aisyah Putri</h4>
                    <p className="mt-1 font-noto-serif text-[12.5px] font-semibold">Putri dari Bpk. Fulan &amp; Ibu Fulanah</p>
                    <p className="mt-1 text-[11px] text-[#52695f]">Bandung, Indonesia</p>
                  </div>
                </div>
              </section>

              <section className="bg-white/60 px-6 py-10">
                <h3 className="text-center font-script text-[42px] text-[#325346]">Rangkaian Acara</h3>
                <div className="islami-divider my-4" />
                <div className="space-y-4">
                  {[
                    { title: "Akad Nikah", time: "08.00 WIB - 10.00 WIB", loc: "Masjid Istiqlal, Jakarta", icon: HeartHandshake },
                    { title: "Resepsi", time: "11.00 WIB - 13.00 WIB", loc: "Grand Ballroom Hotel, Jakarta", icon: Calendar },
                  ].map((ev) => (
                    <div key={ev.title} className="islami-frame rounded-xl bg-white/85 p-5 text-center shadow-sm">
                      <ev.icon className="mx-auto mb-2 text-[#775a19]" size={20} />
                      <h4 className="font-noto-serif text-[24px] font-bold text-[#325346]">{ev.title}</h4>
                      <p className="mt-2 text-[12.5px] font-semibold">{dateText}</p>
                      <p className="mt-1 flex items-center justify-center gap-1.5 text-[12px] text-[#52695f]"><Clock size={13} />{ev.time}</p>
                      <p className="mt-1 flex items-center justify-center gap-1.5 text-[12px] text-[#52695f]"><MapPin size={13} />{ev.loc}</p>
                      <button onClick={() => toast("Contoh: buka Google Calendar / Maps.")} className="mt-4 rounded-full border border-[#325346] px-4 py-2 text-[11px] font-semibold text-[#325346]">Simpan / Buka Lokasi</button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="px-6 py-10 text-center">
                <h3 className="font-script text-[42px] text-[#325346]">Lokasi Acara</h3>
                <div className="islami-divider my-4" />
                <div className="overflow-hidden rounded-2xl border border-[#d4af37]/25 bg-white shadow-sm">
                  <div className="flex aspect-video items-center justify-center bg-[#efeeeb] px-4 text-[12px] text-[#52695f]">Peta Google Maps dapat disematkan dari data lokasi acara.</div>
                  <div className="p-4">
                    <p className="font-noto-serif text-[15px] font-semibold">Masjid Istiqlal / Hotel Ballroom</p>
                    <button onClick={() => toast("Contoh: buka Google Maps.")} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#325346] px-4 py-2 text-[11px] font-semibold text-white"><MapPin size={13} />Petunjuk Arah</button>
                  </div>
                </div>
              </section>

              <section className="bg-[#325346] px-5 py-10 text-white">
                <h3 className="text-center font-script text-[42px] text-[#f3d98b]">Galeri Momen</h3>
                <div className="islami-divider my-4 opacity-70" />
                <div className="grid grid-cols-2 gap-2">
                  {images.map((src, i) => (
                    <button key={src} onClick={() => setSelected(i)} className={cn("overflow-hidden rounded-xl ring-1 ring-white/10", i % 3 === 0 ? "row-span-2" : "")}>
                      <img src={src} alt="Galeri" className="h-full min-h-[92px] w-full object-cover" />
                    </button>
                  ))}
                </div>
              </section>

              <section className="px-6 py-10">
                <h3 className="text-center font-script text-[42px] text-[#325346]">RSVP & Ucapan</h3>
                <div className="islami-divider my-4" />
                <p className="mb-4 text-center text-[10px] uppercase tracking-[0.14em] text-[#52695f]">Sumber: {wishesSource === "supabase" ? "Supabase realtime" : "Fallback lokal"}</p>
                <form onSubmit={submitWish} className="space-y-2.5 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-[#d4af37]/15">
                  <input name="name" required maxLength={60} placeholder="Nama Lengkap" className="w-full rounded-xl border border-[#325346]/12 bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-[#d4af37]" />
                  <select name="presence" className="w-full rounded-xl border border-[#325346]/12 bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-[#d4af37]"><option value="Hadir">Hadir</option><option value="Tidak Hadir">Tidak Hadir</option><option value="Masih Ragu">Masih Ragu</option></select>
                  <textarea name="message" required rows={3} maxLength={500} placeholder="Berikan ucapan & doa restu" className="w-full resize-none rounded-xl border border-[#325346]/12 bg-white px-3.5 py-2.5 text-[13px] outline-none focus:border-[#d4af37]" />
                  <button type="submit" disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#325346] py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white disabled:opacity-70">{sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}Kirim Ucapan</button>
                </form>
                <div className="mt-4 max-h-[220px] space-y-2 overflow-y-auto pr-1">
                  {loadingWishes ? <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin text-[#325346]" /></div> : wishes.slice(0, 12).map((w) => (
                    <div key={w.id} className="rounded-xl border-l-4 border-[#d4af37] bg-white/85 p-3 shadow-sm">
                      <div className="flex items-center justify-between gap-2"><strong className="text-[12.5px] text-[#325346]">{w.name}</strong><span className="rounded-full bg-[#325346]/8 px-2 py-0.5 text-[8px] font-bold uppercase text-[#775a19]">{w.presence}</span></div>
                      <p className="mt-1 text-[12px] leading-5 text-[#52695f]">{w.message}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white/55 px-6 py-10 text-center">
                <h3 className="font-script text-[42px] text-[#325346]">Tanda Kasih</h3>
                <div className="islami-divider my-4" />
                <p className="mx-auto mb-5 max-w-[300px] text-[12.5px] leading-6 text-[#52695f]">Doa restu Anda merupakan karunia terindah. Namun jika memberi adalah ungkapan tanda kasih, dapat melalui:</p>
                <div className="space-y-3">
                  {BANKS.map((b) => (
                    <div key={b.number} className="rounded-2xl border border-[#d4af37]/25 bg-white p-4 shadow-sm">
                      <div className="text-[18px] font-bold tracking-[0.18em] text-[#325346]">{b.bank}</div>
                      <div className="mt-1 font-noto-serif text-[20px] tracking-wider">{b.number}</div>
                      <div className="text-[11px] text-[#52695f]">{b.name}</div>
                      <button onClick={() => void copyText(b.number, `Nomor ${b.bank}`)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#f5f3f0] px-3 py-1.5 text-[11px] font-semibold text-[#325346]"><Copy size={12} />Salin Nomor</button>
                    </div>
                  ))}
                </div>
              </section>

              <footer className="bg-[#325346] px-6 py-10 text-center text-white">
                <h3 className="font-script text-[46px] text-[#d4af37]">Rizky &amp; Aisyah</h3>
                <p className="mx-auto mt-3 max-w-[300px] text-[11.5px] leading-6 text-white/72">Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.</p>
                <p className="mt-5 font-noto-serif text-[12px] text-[#f3d98b]">Wassalamu’alaikum Warahmatullahi Wabarakatuh</p>
                <p className="mt-8 text-[9px] uppercase tracking-[0.2em] text-white/35">Biz Invite Demo • Tema Islami</p>
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
              <p className="mt-3 text-sm text-on-surface-variant">Pratinjau kaya sementara difokuskan pada tema Islami. Pilih tema Islami untuk melihat template lengkap.</p>
              <button onClick={closeModal} className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary">Tutup</button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
