import { cn } from "../../utils/cn";

/** Pemisah arabesque — motif mihrab ganda dengan titik tengah. */
export function Arabesque({ className, dot = true }: { className?: string; dot?: boolean }) {
  return (
    <svg viewBox="0 0 160 30" fill="currentColor" className={cn("h-6 w-28", className)} aria-hidden>
      <path
        d="M80 0 C65 14 45 15 0 15 C45 15 65 16 80 30 C95 16 115 15 160 15 C115 15 95 14 80 0 Z"
        opacity="0.7"
      />
      {dot && <circle cx="80" cy="15" r="2.5" />}
    </svg>
  );
}

/** Monogram logo: kubah mihrab + bintang segi delapan + bulan sabit halus. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={cn("h-9 w-9", className)} aria-hidden>
      <path
        d="M24 4c-1.2 3.4-4.2 6-8 6 3.8 0 6.8 2.6 8 6 1.2-3.4 4.2-6 8-6-3.8 0-6.8-2.6-8-6Z"
        fill="#e9c176"
      />
      <path
        d="M10 44V26c0-7.7 6.3-14 14-14s14 6.3 14 14v18"
        stroke="#325346"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="5" y="41" width="38" height="3.5" rx="1.75" fill="#775a19" />
      <path d="M24 20l2.4 4.6 4.6 2.4-4.6 2.4L24 34l-2.4-4.6-4.6-2.4 4.6-2.4L24 20Z" fill="#775a19" />
    </svg>
  );
}
