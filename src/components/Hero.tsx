import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, BadgeCheck, Lock, LogIn, PlayCircle, Sparkles, Star } from "lucide-react";
import { useUi } from "../lib/ui";
import { CountdownPills } from "./ui/Countdown";
import { Reveal } from "./ui/Reveal";

export function Hero() {
  const { createInvite, openDemo, openLogin } = useUi();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 18 });
  const sy = useSpring(my, { stiffness: 50, damping: 18 });
  const blobX = useTransform(sx, [-0.5, 0.5], [-24, 24]);
  const blobY = useTransform(sy, [-0.5, 0.5], [-18, 18]);
  const blob2X = useTransform(sx, [-0.5, 0.5], [28, -28]);
  const blob2Y = useTransform(sy, [-0.5, 0.5], [20, -20]);
  const phoneRot = useTransform(sx, [-0.5, 0.5], [-1.6, 1.6]);

  return (
    <section
      id="beranda"
      className="relative mx-auto w-full max-w-[1360px] overflow-hidden px-4 pb-20 pt-10 sm:px-5 md:overflow-visible md:px-8 md:pt-14"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
    >
      <motion.div style={{ x: blobX, y: blobY }} className="pointer-events-none absolute -left-24 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <motion.div style={{ x: blob2X, y: blob2Y }} className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col items-start lg:col-span-7 lg:pr-8">
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-surface-container-low px-4 py-1.5 shadow-sm">
              <Sparkles size={13} className="text-secondary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
                Platform Undangan Digital Multi-Tema
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="font-headline text-[36px] leading-[44px] tracking-[-0.015em] text-primary sm:text-[44px] sm:leading-[52px] md:text-[64px] md:leading-[72px]">
              Buat undangan digital profesional dengan <span className="italic text-secondary">Skatim Invitation</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mb-8 mt-5 max-w-xl text-[17px] leading-7 text-on-surface-variant">
              Pilih tema sesuai acara Anda: Islami, Modern, Adat Jawa, Adat Sunda, Adat Lampung, dan lainnya.
              Lengkap dengan RSVP, galeri, peta, amplop digital, dan demo interaktif.
            </p>
          </Reveal>

          <Reveal delay={0.24} className="w-full sm:w-auto">
            <div className="mb-2 flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <button onClick={createInvite} className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3 text-[14px] font-semibold tracking-wide text-on-primary shadow-lift transition-all hover:-translate-y-0.5 hover:bg-primary-container sm:w-auto">
                <Lock size={14} className="opacity-80" />
                Mulai Buat Undangan
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={() => openDemo("Islami Emerald")} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-low px-7 py-3 text-[14px] font-semibold tracking-wide text-secondary shadow-sm transition-all hover:bg-surface-container sm:w-auto">
                <PlayCircle size={16} />
                Lihat Demo Tema
              </button>
              <button onClick={openLogin} className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-[14px] font-semibold tracking-wide text-primary transition hover:bg-surface-container-high sm:w-auto">
                <LogIn size={16} />
                Masuk Akun
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.32} className="w-full">
            <div className="grid w-full max-w-xl grid-cols-3 gap-3 rounded-xl bg-surface-container-low/80 p-4 shadow-sm ring-1 ring-surface-container">
              <div className="flex flex-col">
                <span className="font-headline text-[24px] font-semibold leading-8 text-primary tabular">Multi-Tema</span>
                <span className="text-[12px] leading-5 text-on-surface-variant">Islami, Modern, Adat</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-secondary">
                  <span className="font-headline text-[24px] font-semibold leading-8 tabular">4.9</span>
                  <Star size={14} fill="currentColor" />
                </div>
                <span className="text-[12px] leading-5 text-on-surface-variant">Rating pengguna</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-primary">
                  <BadgeCheck size={16} className="text-secondary" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Realtime</span>
                </div>
                <span className="text-[12px] leading-5 text-on-surface-variant">RSVP & ucapan</span>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="relative mt-6 flex justify-center lg:col-span-5 lg:mt-0">
          <div className="absolute inset-0 scale-90 rounded-full bg-gradient-to-tr from-secondary/15 via-primary/10 to-transparent blur-2xl" />
          <motion.div style={{ rotate: phoneRot }} initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }} className="relative z-10">
            <div className="animate-float-slow relative w-[300px] rounded-[44px] bg-inverse-surface p-3 shadow-phone sm:w-[336px]">
              <div className="relative flex w-full select-none flex-col overflow-hidden rounded-[34px] bg-surface-container-lowest">
                <div className="flex h-7 w-full items-center justify-center bg-surface-container-lowest pt-2"><div className="h-4 w-20 rounded-full bg-inverse-surface" /></div>
                <div className="texture-grain flex flex-col items-center px-5 pb-5 pt-1 text-center">
                  <span className="mt-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-secondary">Demo Undangan</span>
                  <h2 className="mt-1 font-headline text-[26px] leading-8 text-primary">Raka &amp; Nanda</h2>
                  <p className="mt-1 text-[11.5px] leading-5 text-on-surface-variant">Pilih tema Islami, Modern, atau Adat</p>
                  <div className="my-4 flex w-full flex-col items-center rounded-xl bg-surface-container-low p-3">
                    <span className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-secondary">Hitung Mundur Acara</span>
                    <CountdownPills compact />
                  </div>
                  <button onClick={() => openDemo("Modern Minimal")} className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-[11.5px] font-semibold tracking-wide text-on-primary shadow transition hover:bg-primary-container">Buka Demo</button>
                </div>
                <div className="flex h-4 w-full items-center justify-center pb-1"><div className="h-1 w-24 rounded-full bg-outline/50" /></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
