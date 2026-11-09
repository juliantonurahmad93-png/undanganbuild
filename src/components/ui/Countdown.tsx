import { useState, useEffect } from "react";
import { EVENT_DATE } from "../../lib/event";
import { cn } from "../../utils/cn";

function getLeft() {
  const diff = Math.max(0, EVENT_DATE.getTime() - Date.now());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

export function CountdownPills({ compact = false }: { compact?: boolean }) {
  const [t, setT] = useState(getLeft());
  useEffect(() => { const id = setInterval(() => setT(getLeft()), 1000); return () => clearInterval(id); }, []);
  const items = [["Hari", t.d], ["Jam", t.h], ["Menit", t.m], ["Detik", t.s]] as const;
  return (
    <div className={cn("grid grid-cols-4", compact ? "gap-1.5" : "gap-2")}>
      {items.map(([k, v]) => (
        <div key={k} className={cn("rounded-lg bg-surface-container-lowest text-center shadow-sm", compact ? "px-1 py-1.5" : "px-2 py-2")}>
          <div className={cn("font-headline font-semibold tabular text-primary", compact ? "text-[16px]" : "text-[20px]")}>{String(v).padStart(2, "0")}</div>
          <div className="text-[8px] uppercase tracking-[0.12em] text-on-surface-variant">{k}</div>
        </div>
      ))}
    </div>
  );
}
