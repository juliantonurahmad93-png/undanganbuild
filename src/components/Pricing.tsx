import { CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { PLANS } from "../data/content";
import { Reveal } from "./ui/Reveal";
import { useUi } from "../lib/ui";
import { cn } from "../utils/cn";

export function Pricing() {
  const { openRegister } = useUi();
  return (
    <section id="harga" className="pattern-geom w-full bg-surface-container-low py-20">
      <div className="mx-auto max-w-[1360px] px-5 md:px-8">
        <Reveal className="mx-auto mb-10 max-w-xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">Paket Harga</span>
          <h2 className="mt-2 font-headline text-[32px] font-medium leading-[40px] text-primary md:text-[40px] md:leading-[48px]">Pilih paket sesuai kebutuhan</h2>
          <p className="mt-3 text-[15px] leading-6 text-on-surface-variant">Transparan dan mudah dipahami. Cocok untuk uji coba, acara personal, atau kebutuhan bisnis.</p>
        </Reveal>
        <div className="mx-auto grid w-full max-w-4xl grid-cols-1 items-stretch gap-6 pt-4 md:grid-cols-2">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 0.1} className="h-full">
              <div className={cn("relative flex h-full flex-col rounded-xl bg-surface-container-lowest p-7 transition-shadow duration-300", plan.featured ? "shadow-lift ring-2 ring-secondary" : "shadow-sm hover:shadow-md")}>
                {plan.featured && <div className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-secondary px-4 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-on-secondary shadow-md"><Sparkles size={11} />Paling Populer</div>}
                <span className={cn("text-[10px] font-semibold uppercase tracking-[0.18em]", plan.featured ? "mt-1 text-secondary" : "text-on-surface-variant")}>{plan.label}</span>
                <h3 className="mt-1 font-headline text-[27px] leading-9 text-primary">{plan.name}</h3>
                <div className="my-5 flex items-baseline gap-1.5">
                  <span className={cn("font-headline text-[36px] font-bold leading-10 tabular", plan.featured ? "gold-shimmer" : "text-primary")}>{plan.price}</span>
                  <span className="text-[12.5px] text-on-surface-variant">{plan.suffix}</span>
                </div>
                <p className="mb-5 text-[13px] leading-[22px] text-on-surface-variant">{plan.desc}</p>
                <ul className="mb-8 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f.text} className={cn("flex items-center gap-2 text-[13px] leading-5", f.ok ? "text-on-surface-variant" : "text-outline")}>
                      {f.ok ? <CheckCircle2 size={15} className={plan.featured ? "text-secondary" : "text-primary"} /> : <XCircle size={15} />}
                      <span className={cn(!f.ok && "line-through")}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => openRegister(`${plan.name} - ${plan.price}`)} className={cn("w-full rounded-lg px-5 text-[13.5px] font-semibold tracking-wide transition-all", plan.featured ? "bg-primary py-3 text-on-primary shadow-lift hover:-translate-y-0.5 hover:bg-primary-container" : "bg-surface-container py-2.5 text-primary hover:bg-surface-container-high")}>{plan.cta}</button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
