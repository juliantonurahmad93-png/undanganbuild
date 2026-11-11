import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Heart } from "lucide-react";
import { THEME_FILTERS, THEMES, type Theme } from "../data/content";
import { Reveal } from "./ui/Reveal";
import { useUi } from "../lib/ui";
import { cn } from "../utils/cn";

export function Themes() {
  const { openDemo, openRegister, toast } = useUi();
  const [filter, setFilter] = useState<string>("all");
  const visible = THEMES.filter((t) => filter === "all" || t.category === filter);

  const pick = (theme: Theme) => {
    toast(`Tema ${theme.name} dipilih.`);
    openRegister(`Tema: ${theme.name}`);
  };

  return (
    <section id="tema" className="pattern-geom relative w-full bg-surface-container-low py-20">
      <div className="mx-auto max-w-[1360px] px-5 md:px-8">
        <Reveal className="mx-auto mb-10 flex max-w-2xl flex-col items-center text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">Koleksi Tema</span>
          <h2 className="mt-2 font-headline text-[32px] font-medium leading-[40px] text-primary md:text-[40px] md:leading-[48px]">
            Demo Tema untuk Berbagai Acara
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-on-surface-variant">
            Skatim Invitation menyediakan tema Islami, Modern, Adat Jawa, Adat Sunda, Adat Lampung, dan pilihan lainnya yang bisa dikembangkan.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
            {THEME_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full px-5 py-2 text-[12px] font-medium tracking-[0.1em] transition-all duration-300",
                  filter === f.key ? "bg-primary text-on-primary shadow-lift" : "bg-surface-container-lowest text-on-surface-variant shadow-sm hover:bg-surface-container-high hover:text-on-surface",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Reveal>

        <motion.div layout className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {visible.map((theme) => (
              <motion.article
                layout
                key={theme.id}
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-shadow duration-300 hover:shadow-lift"
              >
                <div className="relative h-64 overflow-hidden bg-primary-container">
                  <img src={theme.image} alt={`Tema ${theme.name}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-inverse-surface/40 to-transparent" />
                  <div className="absolute right-3 top-3 rounded-md bg-inverse-surface/75 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-inverse-on-surface backdrop-blur">{theme.badge}</div>
                  <button onClick={() => openDemo(theme.name)} className="absolute inset-0 flex items-center justify-center bg-inverse-surface/0 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:bg-inverse-surface/25 group-hover:opacity-100" aria-label={`Pratinjau ${theme.name}`}>
                    <span className="flex translate-y-2 items-center gap-2 rounded-full bg-surface-container-lowest px-5 py-2.5 text-[12px] font-bold tracking-wide text-primary shadow-xl transition-transform duration-300 group-hover:translate-y-0"><Eye size={15} />Buka Demo</span>
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-1.5 font-headline text-[21px] leading-7 text-primary">{theme.name}</h3>
                  <p className="mb-5 text-[13px] leading-[22px] text-on-surface-variant">{theme.description}</p>
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <button onClick={() => openDemo(theme.name)} className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[11.5px] font-semibold tracking-wide text-on-primary shadow-sm transition hover:bg-primary-container"><Eye size={14} />Demo</button>
                    <button onClick={() => pick(theme)} title="Pilih tema" className="flex h-[34px] w-[38px] items-center justify-center rounded-md bg-surface-container text-primary transition hover:bg-secondary hover:text-on-secondary"><Heart size={15} /></button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
