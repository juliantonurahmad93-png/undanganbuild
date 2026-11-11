import { useState, type FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { useUi } from "../../lib/ui";
import { checkSubdomainAvailable, normalizeSubdomain, signInAccount, signUpAccount, getSessionUser, fetchMyProfile } from "../../lib/supabase";
import { ADMIN_EMAILS } from "../../data/content";

const fieldCls = "w-full rounded-md bg-surface-container-low px-4 py-2.5 text-[14px] text-on-surface outline-none ring-1 ring-transparent transition placeholder:text-outline focus:bg-surface-container-lowest focus:ring-primary/40";
const labelCls = "mb-1.5 block text-[11.5px] font-semibold tracking-wide text-on-surface";

export function LoginModal() {
  const { modal, closeModal, openRegister, toast, openAdmin, openSettings, refreshProfile } = useUi();
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("id")).trim().toLowerCase();
    const password = String(fd.get("password"));
    setLoading(true);
    const res = await signInAccount(email, password);
    setLoading(false);
    if (!res.ok) { toast(res.message, false); return; }
    closeModal();
    await refreshProfile();
    const u = await getSessionUser();
    const p = u ? await fetchMyProfile(u.id) : null;
    const admin = (u?.email && ADMIN_EMAILS.map((x) => x.toLowerCase()).includes(u.email.toLowerCase())) || p?.role === "admin" || u?.user_metadata?.role === "admin";
    if (admin) { toast("Login admin berhasil."); openAdmin(); }
    else { toast("Berhasil masuk. Status akun dicek untuk akses setting."); openSettings(); }
  };

  return (
    <Modal open={modal === "login"} onClose={closeModal}>
      <div className="p-6 pb-2 pr-14 sm:p-7 sm:pb-2 md:p-8 md:pb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Skatim Invitation</span>
        <h3 className="mt-0.5 font-headline text-[24px] text-primary">Masuk ke Akun</h3>
        <p className="mt-1 text-[12px] text-on-surface-variant">Login aman via Supabase Auth. Akses setting memerlukan persetujuan admin.</p>
      </div>
      <form onSubmit={submit} className="space-y-4 p-6 pt-4 sm:p-7 sm:pt-4 md:p-8 md:pt-4">
        <div><label className={labelCls}>Email</label><input name="id" type="email" required placeholder="email@contoh.com" className={fieldCls} autoComplete="email" /></div>
        <div><label className={labelCls}>Kata Sandi</label><input name="password" type="password" required placeholder="••••••••" className={fieldCls} autoComplete="current-password" /></div>
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-[14px] font-semibold tracking-wide text-on-primary shadow-lift transition hover:bg-primary-container disabled:opacity-70">{loading && <Loader2 size={16} className="animate-spin" />} Masuk</button>
        <button type="button" onClick={closeModal} className="w-full rounded-lg bg-surface-container py-2.5 text-[13px] font-semibold text-primary transition hover:bg-surface-container-high">Batal</button>
        <p className="pt-1 text-center text-[12.5px] text-on-surface-variant">Belum punya akun? <button type="button" onClick={() => openRegister()} className="font-bold text-secondary hover:underline">Daftar</button></p>
      </form>
    </Modal>
  );
}

export function RegisterModal() {
  const { modal, registerPreset, closeModal, openLogin, toast } = useUi();
  const [loading, setLoading] = useState(false);
  const [subdomain, setSubdomain] = useState("");
  const [subHint, setSubHint] = useState<string | null>(null);

  const onSubdomain = (v: string) => {
    const s = normalizeSubdomain(v);
    setSubdomain(s);
    setSubHint(s ? `Alamat undangan: ${window.location.origin}/${s} (dikunci saat pendaftaran)` : null);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const couple = String(fd.get("couple"));
    const email = String(fd.get("email")).trim().toLowerCase();
    const password = String(fd.get("password"));
    const slug = normalizeSubdomain(subdomain || String(fd.get("subdomain") || ""));
    if (!slug) { toast("Alamat link undangan wajib diisi saat pendaftaran.", false); return; }
    setLoading(true);
    const avail = await checkSubdomainAvailable(slug);
    if (!avail.available) { setLoading(false); toast(avail.message || "Alamat link sudah digunakan.", false); return; }
    const reg = await signUpAccount(email, password, couple, slug);
    if (!reg.ok) { setLoading(false); toast(reg.message, false); return; }
    setLoading(false);
    if (reg.needsEmailConfirm) {
      toast(`Akun dibuat dengan alamat link "/${slug}". Konfirmasi email masih diperlukan oleh pengaturan Supabase saat ini. Untuk tanpa konfirmasi, matikan Confirm Email di Supabase Auth > Providers > Email.`, false);
    } else {
      toast(`Pendaftaran berhasil. Alamat link "/${slug}" dikunci. Silakan chat admin via WhatsApp untuk permohonan persetujuan.`);
    }
    setSubdomain(""); setSubHint(null);
    form.reset(); setTimeout(() => { closeModal(); window.location.hash = "pending"; }, 1200);
  };

  return (
    <Modal open={modal === "register"} onClose={closeModal} maxWidth="max-w-lg">
      <div className="p-6 pb-2 pr-14 sm:p-7 sm:pb-2 md:p-8 md:pb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">Mulai</span>
        <h3 className="mt-0.5 font-headline text-[24px] text-primary">Daftar Akun Skatim Invitation</h3>
        <p className="mt-1 text-[12px] text-on-surface-variant">Masukkan alamat link undangan sekarang — hanya bisa dipakai sekali saat daftar dan tidak bisa diganti setelah terdaftar (contoh: domain.com/raka-nanda). Akses setting tetap memerlukan persetujuan admin.</p>
      </div>
      <form onSubmit={submit} className="space-y-3.5 p-6 pt-4 sm:p-7 sm:pt-4 md:p-8 md:pt-4">
        {registerPreset && <div className="flex items-center justify-between rounded-md bg-primary/10 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary"><span>Terpilih: <strong className="text-secondary">{registerPreset}</strong></span><Check size={14} /></div>}
        <div><label className={labelCls}>Nama/Acara</label><input name="couple" required placeholder="Contoh: Raka & Nanda / Acara Kantor" className={fieldCls} /></div>
        <div>
          <label className={labelCls}>Alamat link undangan <span className="font-normal text-secondary">(wajib, sekali daftar)</span></label>
          <div className="flex items-center rounded-md bg-surface-container-low ring-1 ring-transparent focus-within:bg-surface-container-lowest focus-within:ring-primary/40">
            <input name="subdomain" required minLength={3} maxLength={40} pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]" value={subdomain} onChange={(e) => onSubdomain(e.target.value)} placeholder="raka-nanda" className="w-full bg-transparent px-4 py-2.5 text-[14px] text-on-surface outline-none placeholder:text-outline" autoComplete="off" />
            <span className="shrink-0 pr-3 text-[12px] text-on-surface-variant">/{subdomain || "nama-link"}</span>
          </div>
          <p className="mt-1 text-[11px] text-on-surface-variant">{subHint || "Gunakan huruf kecil, angka, tanda hubung. Alamat link akan dikunci setelah pendaftaran (path setelah domain)."}</p>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div><label className={labelCls}>No. WhatsApp</label><input name="whatsapp" type="tel" required placeholder="08123456789" className={fieldCls} /></div>
          <div><label className={labelCls}>Email</label><input name="email" type="email" required placeholder="nama@email.com" className={fieldCls} /></div>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div><label className={labelCls}>Perkiraan Bulan Acara</label><select name="month" className={fieldCls}><option>Bulan Depan</option><option>2 - 3 Bulan Lagi</option><option>3 - 6 Bulan Lagi</option><option>Belum ditentukan</option></select></div>
          <div><label className={labelCls}>Kata Sandi</label><input name="password" type="password" required minLength={6} placeholder="Minimal 6 karakter" className={fieldCls} /></div>
        </div>
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-[14px] font-semibold tracking-wide text-on-primary shadow-lift transition hover:bg-primary-container disabled:opacity-70">{loading && <Loader2 size={16} className="animate-spin" />} Daftar & Kunci Alamat Link</button>
        <button type="button" onClick={closeModal} className="w-full rounded-lg bg-surface-container py-2.5 text-[13px] font-semibold text-primary transition hover:bg-surface-container-high">Batal</button>
        <p className="pt-1 text-center text-[12.5px] text-on-surface-variant">Sudah punya akun? <button type="button" onClick={openLogin} className="font-bold text-secondary hover:underline">Masuk</button></p>
      </form>
    </Modal>
  );
}
