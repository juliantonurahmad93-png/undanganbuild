import { CalendarClock, Images, MapPin, MessageSquareHeart, Palette, Wallet } from "lucide-react";
import { Reveal } from "./ui/Reveal";

const FEATURES = [
  { icon: Palette, title: "Tema Multi-Budaya", desc: "Demo dan template Islami, Modern, Adat Jawa, Adat Sunda, Adat Lampung, Minang, dan lainnya." },
  { icon: CalendarClock, title: "RSVP Realtime", desc: "Konfirmasi kehadiran dan buku ucapan tersinkron realtime untuk memudahkan rekap tamu." },
  { icon: MapPin, title: "Peta & Jadwal", desc: "Navigasi lokasi acara dan informasi jadwal yang mudah dibuka dari perangkat tamu." },
  { icon: Images, title: "Galeri & Privasi", desc: "Tampilkan foto acara dengan opsi privasi sesuai kebutuhan pengguna." },
  { icon: Wallet, title: "Amplop Digital", desc: "Tampilkan rekening/QRIS sebagai informasi hadiah tanpa memotong dana." },
  { icon: MessageSquareHeart, title: "Ucapan & Interaksi", desc: "Tamu dapat mengirim ucapan/doa dan status kehadiran langsung dari undangan." },
];

export function Features() {
  return (
    <section id="fitur" className="mx-auto w-full max-w-[1360px] px-5 py-20 md:px-8">
      <Reveal className="mx-auto mb-12 max-w-xl text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">Fitur Skatim Invitation</span>
        <h2 className="mt-2 font-headline text-[32px] font-medium leading-[40px] text-primary md:text-[40px] md:leading-[48px]">Satu platform untuk berbagai gaya undangan</h2>
        <p className="mt-3 text-[15px] leading-6 text-on-surface-variant">Fleksibel untuk acara pernikahan dan event lain, dengan pilihan tema yang bisa disesuaikan.</p>
      </Reveal>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.08}>
            <div className="group flex h-full flex-col items-start rounded-xl bg-surface-container-low p-7 shadow-sm ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:bg-surface-container-lowest hover:shadow-lift hover:ring-secondary/20">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-lowest text-secondary shadow-sm transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105">
                <f.icon size={24} strokeWidth={1.8} />
              </div>
              <h3 className="mb-2 font-headline text-[21px] font-semibold leading-7 text-primary">{f.title}</h3>
              <p className="text-[13px] leading-[22px] text-on-surface-variant">{f.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
