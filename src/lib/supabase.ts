import { createClient, type RealtimeChannel, type User } from "@supabase/supabase-js";
import { mergeSettings, type InvitationSettingsRow, type InvitationStatus, type StructuredSettings } from "./invitationSettings";

const SUPABASE_URL = "https://vpkyeisjdyupoaeyrguk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwa3llaXNqZHl1cG9hZXlyZ3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxNjcwMjYsImV4cCI6MjEwOTc0MzAyNn0._vrIUD1CWENiniui6JDREr7bcAF-U_qtzKYfFNmAc8M";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  realtime: { params: { eventsPerSecond: 5 } },
});

export type Wish = { id: string; created_at: string; name: string; presence: string; message: string; theme: string };
export type Lead = { couple_names: string; whatsapp: string; email: string; plan: string; akad_month: string; theme?: string | null; subdomain?: string | null };
export type AccountStatus = "pending" | "approved" | "rejected";
export type Profile = { id: string; email?: string | null; display_name?: string | null; subdomain?: string | null; role?: string | null; status: AccountStatus; created_at?: string; approved_at?: string | null; approved_by?: string | null };

const LOCAL_WISHES_KEY = "bizinvite.localWishes.v1";
export const SEED_WISHES: Wish[] = [
  { id: "seed-1", created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(), name: "Keluarga Besar Hartono", presence: "Hadir", message: "Selamat menempuh hidup baru. Semoga acaranya lancar dan penuh kebahagiaan.", theme: "demo" },
  { id: "seed-2", created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), name: "Rekan Kerja", presence: "Hadir", message: "Bahagia selalu untuk kedua mempelai. Sukses untuk hari istimewanya!", theme: "demo" },
  { id: "seed-3", created_at: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(), name: "Sahabat Lama", presence: "Belum Bisa Hadir", message: "Mohon maaf belum bisa hadir, semoga menjadi keluarga yang harmonis.", theme: "demo" },
];

function readLocal<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; } }
function writeLocal(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function readLocalWishes(): Wish[] { const v = readLocal<unknown>(LOCAL_WISHES_KEY, []); return Array.isArray(v) ? (v as Wish[]) : []; }
function writeLocalWish(wish: Wish) { writeLocal(LOCAL_WISHES_KEY, [wish, ...readLocalWishes()].slice(0, 60)); }
let supabaseHealthy = true;

export function normalizeSubdomain(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").replace(/--+/g, "-").slice(0, 40);
}
export function isValidSubdomain(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(slug);
}

export async function checkSubdomainAvailable(slug: string): Promise<{ available: boolean; message?: string }> {
  const s = normalizeSubdomain(slug);
  if (!isValidSubdomain(s)) return { available: false, message: "Alamat link harus 3-40 karakter: huruf kecil, angka, tanda hubung (tidak diawali/diakhiri '-')." };
  try {
    const { data, error } = await supabase.rpc("is_slug_available", { p_slug: s });
    if (error) throw error;
    return data ? { available: true } : { available: false, message: `Alamat link "/${s}" sudah digunakan. Pilih yang lain.` };
  } catch (e: any) {
    const msg = String(e?.message || "");
    const [p, i] = await Promise.all([
      supabase.from("profiles").select("id").eq("subdomain", s).maybeSingle(),
      supabase.from("invitation_settings").select("id").eq("slug", s).maybeSingle(),
    ]);
    if (!p.error && p.data) return { available: false, message: `Alamat link "/${s}" sudah digunakan.` };
    if (!i.error && i.data) return { available: false, message: `Alamat link "/${s}" sudah digunakan.` };
    if (p.error || i.error) return { available: false, message: msg || "Gagal memeriksa alamat link. Jalankan supabase/schema.sql lalu coba lagi." };
    return { available: true };
  }
}

export async function fetchWishes(): Promise<{ wishes: Wish[]; source: "supabase" | "local" }> {
  try { const { data, error } = await supabase.from("wishes").select("*").order("created_at", { ascending: false }).limit(50); if (error) throw error; supabaseHealthy = true; return { wishes: dedupe([...((data as Wish[]) ?? []), ...readLocalWishes()]), source: "supabase" }; }
  catch { supabaseHealthy = false; return { wishes: dedupe([...readLocalWishes(), ...SEED_WISHES]), source: "local" }; }
}
export async function insertWish(input: { name: string; presence: string; message: string; theme?: string }): Promise<{ wish: Wish; persisted: "supabase" | "local" }> {
  const wish: Wish = { id: crypto.randomUUID(), created_at: new Date().toISOString(), name: input.name.trim().slice(0, 60), presence: input.presence, message: input.message.trim().slice(0, 500), theme: input.theme ?? "demo" };
  try { if (!supabaseHealthy) throw new Error("offline"); const { error } = await supabase.from("wishes").insert(wish); if (error) throw error; return { wish, persisted: "supabase" }; }
  catch { writeLocalWish(wish); return { wish, persisted: "local" }; }
}
export function subscribeWishes(onInsert: (wish: Wish) => void): () => void {
  let channel: RealtimeChannel | null = null;
  try { channel = supabase.channel("bizinvite-wishes").on("postgres_changes", { event: "INSERT", schema: "public", table: "wishes" }, (payload) => onInsert(payload.new as Wish)).subscribe(); } catch {}
  return () => { if (channel) void supabase.removeChannel(channel!); };
}
function dedupe(list: Wish[]): Wish[] { const seen = new Set<string>(); return list.filter((w) => (seen.has(w.id) ? false : (seen.add(w.id), true))); }
export async function submitLead(lead: Lead): Promise<"supabase" | "local"> {
  try { if (!supabaseHealthy) throw new Error("offline"); const { error } = await supabase.from("leads").insert(lead); if (error) throw error; return "supabase"; }
  catch { const arr = readLocal<any[]>("bizinvite.leads.v1", []); writeLocal("bizinvite.leads.v1", [{ ...lead, created_at: new Date().toISOString() }, ...arr].slice(0, 30)); return "local"; }
}

export async function signInAccount(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) return { ok: false as const, message: mapAuthError(error.message) };
  return { ok: true as const };
}
export async function signUpAccount(email: string, password: string, displayName: string, linkSlug: string) {
  const em = email.trim().toLowerCase();
  const slug = normalizeSubdomain(linkSlug);
  if (!isValidSubdomain(slug)) return { ok: false as const, message: "Alamat link harus 3-40 karakter: huruf kecil, angka, tanda hubung (tidak diawali/diakhiri '-'). Contoh: raka-nanda.", needsEmailConfirm: false, hasSession: false, userId: undefined, subdomain: slug };
  const avail = await checkSubdomainAvailable(slug);
  if (!avail.available) return { ok: false as const, message: avail.message || "Alamat link sudah digunakan.", needsEmailConfirm: false, hasSession: false, userId: undefined, subdomain: slug };
  const { data, error } = await supabase.auth.signUp({ email: em, password, options: { data: { display_name: displayName, role: "user", subdomain: slug } } });
  if (error) return { ok: false as const, message: mapAuthError(error.message), needsEmailConfirm: false, hasSession: false, userId: undefined, subdomain: slug };
  const userId = data.user?.id; const hasSession = !!data.session; const needsEmailConfirm = !!userId && !hasSession;
  if (userId && hasSession) await ensureMyProfile(data.user!, displayName, slug);
  return { ok: true as const, needsEmailConfirm, hasSession, userId, subdomain: slug };
}
export async function getSessionUser(): Promise<User | null> { const { data } = await supabase.auth.getUser(); return data.user; }
export async function signOutAccount() { await supabase.auth.signOut(); }

export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!error && data) return data as Profile; return null;
}
export async function ensureMyProfile(user: User, displayName?: string, subdomain?: string): Promise<Profile | null> {
  const existing = await fetchMyProfile(user.id);
  if (existing) {
    if (subdomain && !existing.subdomain) await supabase.from("profiles").update({ subdomain }).eq("id", user.id);
    return existing;
  }
  const profile = { id: user.id, email: user.email, display_name: displayName ?? (user.user_metadata?.display_name as string) ?? "", subdomain: subdomain ?? (user.user_metadata?.subdomain as string) ?? null, role: "user", status: "pending" as AccountStatus };
  const { data, error } = await supabase.from("profiles").upsert(profile, { onConflict: "id" }).select().maybeSingle();
  if (!error && data) return data as Profile; return existing;
}
export async function fetchAllProfiles(): Promise<{ profiles: Profile[]; source: "supabase" | "local"; error?: string }> {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return { profiles: [], source: "local", error: error.message };
  return { profiles: (data as Profile[]) ?? [], source: "supabase" };
}
export async function updateProfileStatus(id: string, status: AccountStatus, approvedBy?: string): Promise<{ ok: boolean; message?: string }> {
  const patch = { status, approved_at: status === "approved" ? new Date().toISOString() : null, approved_by: approvedBy ?? null };
  const { error, data } = await supabase.from("profiles").update(patch).eq("id", id).select("id,status");
  if (error) return { ok: false, message: error.message };
  if (!data || data.length === 0) return { ok: false, message: "Update tidak mengubah data. Pastikan supabase/schema.sql sudah dijalankan dan akun Anda punya akses admin (JWT/email admin atau metadata role admin)." };
  return { ok: true };
}

export type { InvitationSettingsRow, InvitationStatus, StructuredSettings };

export async function fetchMyInvitation(userId: string, _hint = ""): Promise<{ row: InvitationSettingsRow | null; source: "supabase" | "local"; error?: string }> {
  try {
    const { data, error } = await supabase.from("invitation_settings").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    if (data) return { row: normalizeInvitationRow(data as any), source: "supabase" };
    const local = readLocal<InvitationSettingsRow | null>(`bizinvite.inv.${userId}`, null);
    return { row: local ? normalizeInvitationRow(local) : null, source: "local" };
  } catch (e: any) {
    const local = readLocal<InvitationSettingsRow | null>(`bizinvite.inv.${userId}`, null);
    return { row: local ? normalizeInvitationRow(local) : null, source: "local", error: e?.message || String(e) };
  }
}

export async function saveMyInvitation(userId: string, row: Partial<InvitationSettingsRow> & { settings: StructuredSettings }): Promise<{ row: InvitationSettingsRow | null; source: "supabase" | "local"; error?: string }> {
  const existing = row.id ? await supabase.from("invitation_settings").select("slug").eq("id", row.id).maybeSingle().then(r => r.data) : null;
  const fixedSlug = existing?.slug ?? row.slug?.trim() ?? null;
  const settings = mergeSettings({ ...row.settings, general: { ...row.settings.general, slug: fixedSlug ?? row.settings.general.slug } }, row.settings.general.title);
  const payload = {
    user_id: userId,
    slug: fixedSlug,
    theme_id: row.theme_id || settings.general.themeId || "islami-emerald",
    status: (row.status || settings.general.status || "draft") as InvitationStatus,
    title: row.title || settings.general.title || "Undangan",
    settings,
  };
  try {
    const q = row.id
      ? supabase.from("invitation_settings").update(payload).eq("id", row.id).select("*").single()
      : supabase.from("invitation_settings").insert(payload).select("*").single();
    const { data, error } = await q;
    if (error) throw error;
    const out = normalizeInvitationRow(data as any);
    writeLocal(`bizinvite.inv.${userId}`, out);
    return { row: out, source: "supabase" };
  } catch (e: any) {
    const local: InvitationSettingsRow = normalizeInvitationRow({
      id: row.id || `local-${userId}`, user_id: userId, slug: payload.slug, theme_id: payload.theme_id, status: payload.status, title: payload.title, settings: payload.settings, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    } as any);
    writeLocal(`bizinvite.inv.${userId}`, local);
    return { row: local, source: "local", error: e?.message || String(e) };
  }
}

function normalizeInvitationRow(row: any): InvitationSettingsRow {
  return {
    id: String(row.id), user_id: String(row.user_id), slug: row.slug ?? null,
    theme_id: row.theme_id ?? "islami-emerald", status: (row.status ?? "draft") as InvitationStatus,
    title: row.title ?? "Undangan", settings: mergeSettings(row.settings, row.title ?? ""),
    created_at: row.created_at ?? new Date().toISOString(), updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

function mapAuthError(msg: string): string {
  if (/subdomain .*sudah digunakan/i.test(msg)) return msg;
  if (/subdomain wajib/i.test(msg)) return msg;
  if (/duplicate key|unique constraint|23505/i.test(msg) && /subdomain|slug/i.test(msg)) return "Alamat link sudah digunakan. Pilih alamat lain.";
  if (/invalid login credentials/i.test(msg)) return "Email atau kata sandi belum tepat.";
  if (/already registered|user already registered/i.test(msg)) return "Email sudah terdaftar, silakan masuk.";
  if (/at least 6|password.*short|weak password/i.test(msg)) return "Kata sandi minimal 6 karakter (ikuti kebijakan keamanan Supabase).";
  if (/email.*not.*confirm|email_not_confirmed/i.test(msg)) return "Email belum dikonfirmasi. Untuk mode tanpa konfirmasi, matikan Confirm Email di Supabase Auth > Providers > Email.";
  if (/signups not allowed|signup.*disabled/i.test(msg)) return "Pendaftaran dinonaktifkan di Supabase Auth. Aktifkan Email signups di Authentication > Providers > Email.";
  if (/rate limit|too many requests|over_email_send_rate_limit/i.test(msg)) return "Rate limit Supabase Auth. Jika tidak ingin konfirmasi email, matikan Confirm Email di Dashboard; tunggu sebentar lalu coba lagi.";
  if (/email address .* is invalid|invalid email/i.test(msg)) return "Format/validasi email ditolak oleh Supabase Auth. Coba email lain atau cek pengaturan Auth.";
  return `Autentikasi gagal: ${msg}`;
}

export async function fetchPublishedInvitation(slug: string): Promise<{ row: InvitationSettingsRow | null; error?: string }> {
  const s = normalizeSubdomain(slug);
  if (!s) return { row: null, error: "Alamat link tidak valid." };
  try {
    const pub = await supabase.rpc("fetch_published_invitation", { p_slug: s });
    const pubRow = Array.isArray(pub.data) ? pub.data[0] : pub.data;
    if (!pub.error && pubRow) return { row: normalizeInvitationRow(pubRow as any) };
    const { data, error } = await supabase.from("invitation_settings").select("*").eq("slug", s).maybeSingle();
    if (!error && data) {
      const row = normalizeInvitationRow(data as any);
      if (row.status !== "published") return { row: null, error: "draft" };
      return { row };
    }
    const st = await supabase.rpc("get_invitation_link_status", { p_slug: s });
    const info = Array.isArray(st.data) ? st.data[0] : st.data;
    if (!st.error && info?.exists) return { row: null, error: info.published ? "schema_drift" : "draft" };
    return { row: null, error: "not_found" };
  } catch (e: any) {
    return { row: null, error: e?.message || String(e) };
  }
}
