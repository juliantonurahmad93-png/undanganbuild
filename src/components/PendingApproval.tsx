import { ArrowLeft, Clock3, RefreshCw, ShieldAlert } from "lucide-react";
import { useUi, statusLabel } from "../lib/ui";

export function PendingApproval() {
  const { user, profile, refreshProfile, openLanding, toast } = useUi();
  return (
    <div className="min-h-screen bg-background px-5 pb-12 pt-28 text-on-surface">
      <div className="mx-auto max-w-xl rounded-2xl bg-surface-container-low p-8 shadow-sm">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/15 text-secondary"><Clock3 size={28} /></div>
        <h1 className="font-headline text-[30px] text-primary">Menunggu Persetujuan Admin</h1>
        <p className="mt-3 text-[14px] leading-7 text-on-surface-variant">
          Pendaftaran akun Anda berhasil, tetapi akses ke halaman <strong>Setting</strong> baru bisa digunakan setelah admin menyetujui akun.
        </p>
        <div className="mt-5 rounded-xl bg-surface-container-lowest p-4 text-[13px]">
          <div>Email: <strong>{user?.email}</strong></div>
          <div>Status: <strong>{statusLabel(profile?.status)}</strong></div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => void refreshProfile().then(()=>toast('Status akun diperbarui.'))} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-on-primary"><RefreshCw size={14}/>Cek Status</button>
          <button onClick={openLanding} className="inline-flex items-center gap-2 rounded-md bg-surface-container px-4 py-2 text-[13px] font-semibold text-primary"><ArrowLeft size={14}/>Kembali</button>
        </div>
        <p className="mt-4 flex items-start gap-2 text-[12px] text-on-surface-variant"><ShieldAlert size={14} className="mt-0.5 shrink-0"/>Jika admin sudah menyetujui tetapi status belum berubah, jalankan `supabase/schema.sql` dan pastikan tabel `profiles`/policy aktif, lalu klik Cek Status.</p>
      </div>
    </div>
  );
}
