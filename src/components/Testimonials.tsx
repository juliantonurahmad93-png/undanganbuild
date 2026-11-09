import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Quote } from "lucide-react";
import { FAQS } from "../data/content";
import { Reveal } from "./ui/Reveal";
import { cn } from "../utils/cn";

const TESTIMONIALS = [
  { quote: "Tema adatnya tampil elegan dan mudah disesuaikan. Tamu bisa RSVP dan kirim ucapan langsung dari undangan.", initials: "RN", name: "Raka & Nanda", place: "Acara pernikahan, Jakarta", tone: "bg-primary-container text-on-primary-container" },
  { quote: "Kami pakai tema modern untuk event kantor. Setup cepat, tampilannya rapi, dan data ucapan mudah dipantau.", initials: "BD", name: "Tim Acara BizDay", place: "Corporate event, Bandung", tone: "bg-secondary-container text-on-secondary-container" },
];

export function Testimonials() {
  const [openIndex, setOpenIndex] = useState<number>(0);
  return (
    <section id="demo" className="mx-auto w-full max-w-[1360px] scroll-mt-24 px-5 py-20 md:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col justify-center lg:col-span-5">
          <Reveal>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">Testimoni</span>
            <h2 className="mb-8 mt-2 font-headline text-[32px] font-medium leading-[40px] text-primary md:text-[40px] md:leading-[48px]">Dipakai untuk berbagai tema acara</h2>
          </Reveal>
          <div className="space-y-4">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={0.08 + i * 0.08}>
                <figure className="relative rounded-xl bg-surface-container-low p-6 shadow-sm ring-1 ring-transparent transition hover:ring-secondary/15">
                  <Quote size={34} className="absolute -top-2 right-5 rotate-180 text-secondary/15" fill="currentColor" />
                  <blockquote className="mb-5 text-[14.5px] italic leading-7 text-on-surface">"{t.quote}"</blockquote>
                  <figcaption className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold", t.tone)}>{t.initials}</div>
                    <div><h4 className="text-[13.5px] font-bold text-primary">{t.name}</h4><span className="text-[12px] text-on-surface-variant">{t.place}</span></div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="flex flex-col lg:col-span-7">
          <Reveal>
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">FAQ</span>
            <h2 className="mb-8 mt-2 font-headline text-[32px] font-medium leading-[40px] text-primary md:text-[40px] md:leading-[48px]">Pertanyaan Umum</h2>
          </Reveal>
          <div className="space-y-2.5">
            {FAQS.map((faq, i) => {
              const open = openIndex === i;
              return (
                <Reveal key={faq.q} delay={i * 0.05}>
                  <div className={cn("overflow-hidden rounded-xl transition-colors", open ? "bg-surface-container-lowest shadow-sm" : "bg-surface-container")}>
                    <button onClick={() => setOpenIndex(open ? -1 : i)} className="flex w-full items-center justify-between gap-4 p-5 text-left" aria-expanded={open}>
                      <span className="font-headline text-[17px] font-semibold leading-6 text-primary">{faq.q}</span>
                      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300", open ? "rotate-180 bg-secondary text-on-secondary" : "bg-surface-container-high text-secondary")}><ChevronDown size={15} /></span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                          <p className="border-t border-surface-container px-5 py-4 text-[13.5px] leading-6 text-on-surface-variant">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
