import { BadgeCheck, Globe, Heart, Mail, MessageCircle } from "lucide-react";
import { LogoMark } from "./ui/Ornament";
import { useUi } from "../lib/ui";

export function Footer() {
  const { toast } = useUi();
  const year = new Date().getFullYear();
  const coming = () => toast("Halaman ini akan segera tersedia.");

  return (
    <footer className="w-full bg-surface-container-low shadow-[0_-1px_12px_rgba(45,67,58,0.03)]">
      <div className="mx-auto max-w-[1360px] px-5 py-16 md:px-8">
        <div className="grid grid-cols-1 gap-10 pb-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="mb-3 flex items-center gap-2.5">
              <LogoMark />
              <span className="font-headline text-[22px] text-primary">Biz Invite</span>
            </div>
            <p className="mb-5 max-w-sm text-[13.5px] leading-6 text-on-surface-variant">
              Platform undangan digital multi-tema untuk pernikahan dan acara. Tersedia demo Islami, Modern, Adat Jawa, Adat Sunda, Adat Lampung, dan lainnya.
            </p>
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container px-3.5 py-2">
              <BadgeCheck size={15} className="text-secondary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-secondary">Mudah • Cepat • Realtime</span>
            </div>
            <div className="mt-6 flex items-center gap-2">
              {[Globe, MessageCircle, Mail].map((Icon, i) => (
                <button key={i} onClick={coming} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm transition hover:-translate-y-0.5 hover:text-secondary" aria-label="Kanal">
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-3">
            <h3 className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-primary">Tema</h3>
            <ul className="space-y-2.5 text-[13.5px] text-on-surface-variant">
              {["Islami", "Modern", "Adat Jawa", "Adat Sunda", "Adat Lampung", "Adat Minang"].map((x) => (
                <li key={x}><button onClick={coming} className="transition-colors hover:text-primary">{x}</button></li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4">
            <h3 className="mb-4 text-[12px] font-bold uppercase tracking-[0.18em] text-primary">Bantuan</h3>
            <ul className="space-y-2.5 text-[13.5px] text-on-surface-variant">
              {["Cara membuat undangan", "RSVP & buku ucapan", "Amplop digital / QRIS", "Privasi galeri", "Panel admin"].map((x) => (
                <li key={x}><button onClick={coming} className="transition-colors hover:text-primary">{x}</button></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-surface-container pt-6 md:flex-row">
          <p className="text-[12.5px] text-on-surface-variant">© {year} Biz Invite. Dibuat untuk kebutuhan undangan digital<Heart size={11} className="mx-1 inline text-secondary" fill="currentColor" />multi-tema.</p>
        </div>
      </div>
    </footer>
  );
}
