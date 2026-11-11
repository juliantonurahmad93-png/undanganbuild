import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, MessageCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { DEFAULT_ADMIN_WA } from "../data/content";
import { fetchAdminWa } from "../lib/supabase";
import { useUi, statusLabel } from "../lib/ui";

function waDigits(v: string): string {
  const d = (v || "").replace(/\D+/g, "");
  if (!d) return DEFAULT_ADMIN_WA.replace(/\D+/g, "");
  if (d.startsWith("0")) return "62" + d.slice(1);
  return d;
}

export function PendingApproval() {
  const { user, profile, refreshProfile, openLanding, toast } = useUi();
  const [adminWa, setAdminWa] = useState(DEFAULT_ADMIN_WA);

  useEffect(() => { void fetchAdminWa().then((n) => setAdminWa(n || DEFAULT_ADMIN_WA)); }, []);

  const name = (profile?.display_name || user?.email || "-").trim();
  const slug = (profile?.subdomain || "").trim();
  const text = [
    "Assalamualaikum Admin Skatim Invitation,",
    "",
    "Saya mohon persetujuan/aktivasi akun saya.",
    `Nama: ${name}`,
    `Email: ${user?.email || "-"}`,
    slug ? `Link: ${window.location.origin}/${slug}` : null,
    `Status: ${statusLabel(profile?.status)}`,
    "",
    "Terima kasih.",
  ].filter(Boolean).join("\n");
  const waUrl = `https://wa.me/${waDigits(adminWa)}?text=${encodeURIComponent(text)}`;

  return (
    <div className="min-h-screen bg-background px-5 pb-12 pt-28 text-on-surface">
      <div className="mx-auto max-w-xl rounded-2xl bg-surface-container-low p-8 shadow-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/15 text-secondary"><Clock3 size={28} /></div>
        <h1 className="font-headline text-[30px] text-primary">Menunggu Persetujuan Admin</h1>
        <p className="mt-3 text-[14px] leading-7 text-on-surface-variant">
          Pendaftaran akun Anda berhasil, tetapi akses ke halaman <strong>Setting</strong> baru bisa digunakan setelah admin menyetujui akun. Silakan hubungi admin via WhatsApp untuk permohonan aktivasi.
        </p>
        <div className="mt-5 rounded-xl bg-surface-container-lowest p-4 text-[13px] space-y-1.5">
          <div>Email: <strong>{user?.email || "-"}</strong></div>
          <div>Nama: <strong>{name}</strong></div>
          {slug && <div>Alamat link: <strong>/{slug}</strong></div>}
          <div>Status: <strong>{statusLabel(profile?.status)}</strong></div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <a href={waUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-green-700"><MessageCircle size={14}/>Chat WhatsApp Admin (Minta Approve)</a>
          <button onClick={() => void refreshProfile().then(()=>toast('Status akun diperbarui.'))} className="inline-flex items-center gap-2 rounded-md bg-surface-container px-4 py-2 text-[13px] font-semibold text-primary"><RefreshCw size={14}/>Cek Status</button>
          <button onClick={openLanding} className="inline-flex items-center gap-2 rounded-md bg-surface-container px-4 py-2 text-[13px] font-semibold text-primary"><ArrowLeft size={14}/>Kembali</button>
        </div>
        <p className="mt-4 flex items-start gap-2 text-[12px] text-on-surface-variant"><ShieldAlert size={14} className="mt-0.5 shrink-0"/>Pesan WhatsApp berisi permohonan approve beserta data akun Anda. Nomor admin dapat diatur admin di Panel Admin. Setelah admin menyetujui, klik <strong>Cek Status</strong> untuk memperbarui akses.</p>
      </div>
    </div>
  );
}
