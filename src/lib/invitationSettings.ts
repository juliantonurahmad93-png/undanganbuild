import { THEMES } from "../data/content";

export type InvitationStatus = "draft" | "published" | "archived";

export type StructuredSettings = {
  general: { title: string; slug: string; themeId: string; status: InvitationStatus; timezone: string; language: string };
  couple: {
    groom: { name: string; father: string; mother: string; childOrder: string; photoUrl: string; instagram: string };
    bride: { name: string; father: string; mother: string; childOrder: string; photoUrl: string; instagram: string };
  };
  hero: { openingText: string; guestLabelEnabled: boolean; coverImageUrl: string };
  share: { ogImageUrl: string };
  event: {
    dateDisplay: string;
    countdownIso: string;
    events: Array<{ type: "akad" | "resepsi" | "custom"; title: string; date: string; start: string; end: string; venue: string; address: string; mapUrl: string; note: string }>;
  };
  location: { primaryAddress: string; mapEmbedUrl: string; mapLink: string };
  content: { greeting: string; verseEnabled: boolean; verseAr: string; verseText: string; verseSource: string; closing: string };
  gallery: { enabled: boolean; images: Array<{ url: string; caption: string }> };
  rsvp: { enabled: boolean; fields: { phone: boolean }; presenceOptions: string[] };
  gift: { enabled: boolean; note: string; accounts: Array<{ bank: string; number: string; name: string; qrisUrl: string }> };
  audio: { enabled: boolean; mode: "soft" | "nature" | "beat"; url: string };
  privacy: { hidePhotos: boolean; maskGuestName: boolean };
};

export type InvitationSettingsRow = {
  id: string;
  user_id: string;
  slug: string | null;
  theme_id: string;
  status: InvitationStatus;
  title: string;
  settings: StructuredSettings;
  created_at: string;
  updated_at: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function defaultCountdownIso() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  d.setHours(8, 0, 0, 0);
  return toLocalIso(d);
}

export function defaultStructuredSettings(nameHint = ""): StructuredSettings {
  const couple = nameHint.includes("&") ? nameHint : "Rizky & Aisyah";
  const [groomName, brideName] = couple.split("&").map((s) => s.trim());
  const dateIso = defaultCountdownIso();
  const dateDisplay = new Date(dateIso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return {
    general: { title: couple, slug: "", themeId: "islami-emerald", status: "draft", timezone: "Asia/Jakarta", language: "id" },
    couple: {
      groom: { name: groomName || "Rizky Ramadhan", father: "Bpk. Fulan", mother: "Ibu Fulanah", childOrder: "Putra", photoUrl: "/images/groom.jpg", instagram: "" },
      bride: { name: brideName || "Aisyah Putri", father: "Bpk. Fulan", mother: "Ibu Fulanah", childOrder: "Putri", photoUrl: "/images/bride.jpg", instagram: "" },
    },
    hero: { openingText: "The Wedding of", guestLabelEnabled: true, coverImageUrl: "/images/venue-masjid.jpg" },
    share: { ogImageUrl: "" },
    event: {
      dateDisplay,
      countdownIso: dateIso,
      events: [
        { type: "akad", title: "Akad Nikah", date: dateIso.slice(0, 10), start: "08:00", end: "10:00", venue: "Masjid Istiqlal", address: "Jakarta Pusat", mapUrl: "", note: "" },
        { type: "resepsi", title: "Resepsi", date: dateIso.slice(0, 10), start: "11:00", end: "13:00", venue: "Grand Ballroom Hotel", address: "Jakarta", mapUrl: "", note: "" },
      ],
    },
    location: { primaryAddress: "Masjid Istiqlal / Grand Ballroom Hotel, Jakarta", mapEmbedUrl: "", mapLink: "" },
    content: {
      greeting: "Assalamu’alaikum Warahmatullahi Wabarakatuh. Dengan memohon rahmat Allah SWT, kami bermaksud menyelenggarakan pernikahan.",
      verseEnabled: true,
      verseAr: "وَمِنْ ءَايَٰتِهِۦٓ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًا لِّتَسْكُنُوٓا۟ إِلَيْهَا",
      verseText: "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan-pasangan dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.",
      verseSource: "QS. Ar-Rum: 21",
      closing: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
    },
    gallery: { enabled: true, images: ["/images/bride.jpg", "/images/groom.jpg", "/images/venue-masjid.jpg", "/images/gallery-1.jpg"].map((url) => ({ url, caption: "" })) },
    rsvp: { enabled: true, fields: { phone: false }, presenceOptions: ["Hadir", "Tidak Hadir", "Masih Ragu"] },
    gift: { enabled: true, note: "Doa restu Anda merupakan karunia terindah. Jika memberi adalah ungkapan tanda kasih, dapat melalui:", accounts: [{ bank: "BCA", number: "1234567890", name: "a.n. Rizky Ramadhan", qrisUrl: "" }] },
    audio: { enabled: true, mode: "soft", url: "" },
    privacy: { hidePhotos: false, maskGuestName: false },
  };
}

function isObj(v: unknown): v is Record<string, unknown> { return !!v && typeof v === "object" && !Array.isArray(v); }

export function mergeSettings(raw: unknown, hint = ""): StructuredSettings {
  const d = defaultStructuredSettings(hint);
  if (!isObj(raw)) return d;
  const merge = <T extends object>(base: T, patch: unknown): T => {
    if (!isObj(patch)) return base;
    const out = { ...base } as any;
    for (const k of Object.keys(base as any)) {
      const bv = (base as any)[k]; const pv = (patch as any)[k];
      if (Array.isArray(bv)) out[k] = Array.isArray(pv) ? pv : bv;
      else if (isObj(bv)) out[k] = merge(bv, pv);
      else if (pv !== undefined && typeof pv === typeof bv) out[k] = pv;
      else if (pv !== undefined && pv !== null && typeof bv === "string") out[k] = String(pv);
    }
    return out;
  };
  return merge(d, raw);
}

export function sectionList() {
  return [
    { key: "general", label: "Umum" },
    { key: "couple", label: "Mempelai" },
    { key: "event", label: "Acara" },
    { key: "location", label: "Lokasi" },
    { key: "content", label: "Konten & Ayat" },
    { key: "gallery", label: "Galeri" },
    { key: "rsvp", label: "RSVP" },
    { key: "inbox", label: "Ucapan Masuk" },
    { key: "gift", label: "Amplop Digital" },
    { key: "audio", label: "Audio" },
    { key: "privacy", label: "Privasi" },
  ] as const;
}

export function themeName(id: string) {
  return THEMES.find((t) => t.id === id)?.name ?? id;
}
