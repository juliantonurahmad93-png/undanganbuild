export type Theme = {
  id: string;
  name: string;
  category: "islami" | "modern" | "adat-jawa" | "adat-sunda" | "adat-lampung" | "adat-minang";
  description: string;
  badge: string;
  image: string;
};

export const THEMES: Theme[] = [
  {
    id: "islami-emerald",
    name: "Islami Emerald",
    category: "islami",
    description: "Nuansa hijau zamrud dan aksen emas dengan sentuhan kaligrafi elegan.",
    badge: "Populer",
    image: "/images/theme-emerald.jpg",
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    category: "modern",
    description: "Tata letak bersih, tipografi modern, dan animasi halus untuk acara kontemporer.",
    badge: "Baru",
    image: "/images/theme-midnight.jpg",
  },
  {
    id: "adat-jawa",
    name: "Adat Jawa Klasik",
    category: "adat-jawa",
    description: "Ornamen batik, paes, dan palet cokelat keemasan bernuansa keraton.",
    badge: "Adat",
    image: "/images/theme-sakinah.jpg",
  },
  {
    id: "adat-sunda",
    name: "Adat Sunda Siger",
    category: "adat-sunda",
    description: "Motif Sunda yang lembut dengan aksen putih, hijau, dan detail tradisional.",
    badge: "Adat",
    image: "/images/theme-medina.jpg",
  },
  {
    id: "adat-lampung",
    name: "Adat Lampung Siger",
    category: "adat-lampung",
    description: "Kain tapis, siger, dan warna merah-emas khas Lampung yang megah.",
    badge: "Adat",
    image: "/images/theme-emerald.jpg",
  },
  {
    id: "adat-minang",
    name: "Adat Minang Marawa",
    category: "adat-minang",
    description: "Corak songket dan marawa dengan sentuhan merah, hitam, dan emas.",
    badge: "Adat",
    image: "/images/theme-sakinah.jpg",
  },
  {
    id: "islami-sakinah",
    name: "Islami Sakinah",
    category: "islami",
    description: "Ivory hangat, ornamen mihrab, dan nuansa sakinah yang tenang.",
    badge: "Elegan",
    image: "/images/theme-sakinah.jpg",
  },
  {
    id: "modern-midnight",
    name: "Modern Midnight",
    category: "modern",
    description: "Kontras gelap-terang premium dengan fokus pada foto dan detail acara.",
    badge: "Premium",
    image: "/images/theme-midnight.jpg",
  },
];

export const THEME_FILTERS = [
  { key: "all", label: "Semua Tema" },
  { key: "islami", label: "Islami" },
  { key: "modern", label: "Modern" },
  { key: "adat-jawa", label: "Adat Jawa" },
  { key: "adat-sunda", label: "Adat Sunda" },
  { key: "adat-lampung", label: "Adat Lampung" },
  { key: "adat-minang", label: "Adat Minang" },
] as const;

export const FAQS = [
  {
    q: "Apakah Skatim Invitation mendukung tema adat dan Islami?",
    a: "Ya. Skatim Invitation menyediakan tema Islami, Modern, Adat Jawa, Adat Sunda, Adat Lampung, Adat Minang, dan dapat dikembangkan sesuai kebutuhan.",
  },
  {
    q: "Bisakah foto mempelai disembunyikan untuk privasi?",
    a: "Bisa. Tersedia mode privasi/Hijab-safe untuk menyamarkan foto pada tampilan tertentu atau mengganti dengan elemen visual lain.",
  },
  {
    q: "Berapa lama proses pembuatan undangan?",
    a: "Sekitar 5–10 menit. Isi data acara, pilih tema, lalu undangan siap dibagikan melalui tautan atau WhatsApp.",
  },
  {
    q: "Apakah hadiah/amplop digital dipotong komisi?",
    a: "Tidak. Informasi rekening/QRIS ditampilkan langsung ke tamu; dana masuk ke rekening Anda sesuai metode yang dipilih.",
  },
];

export const PLANS = [
  {
    id: "pro",
    label: "Paling Dipilih",
    name: "Paket Pro",
    price: "Rp 30.000",
    suffix: "/ sekali bayar",
    desc: "Fitur lengkap untuk undangan aktif dengan RSVP dan amplop digital.",
    features: [
      { ok: true, text: "Akses semua tema (Islami/Modern/Adat)" },
      { ok: true, text: "Tamu undangan tanpa batas" },
      { ok: true, text: "RSVP & buku ucapan realtime" },
      { ok: true, text: "Amplop digital / QRIS" },
      { ok: true, text: "Audio & galeri" },
    ],
    cta: "Pilih Paket Pro",
    featured: true,
  },
  {
    id: "business",
    label: "Untuk Kebutuhan Bisnis",
    name: "Paket Business",
    price: "Rp 70.000",
    suffix: "/ sekali bayar",
    desc: "Untuk event skala besar dengan dukungan tambahan.",
    features: [
      { ok: true, text: "Semua fitur Paket Pro" },
      { ok: true, text: "Check-in / manajemen tamu lanjutan" },
      { ok: true, text: "Custom alamat link /nama (opsional)" },
      { ok: true, text: "Pendampingan setup" },
    ],
    cta: "Pilih Paket Business",
    featured: false,
  },
];

export const ADMIN_EMAILS = ["juliantonurahmad93@gmail.com", "admin@skatiminvitation.id", "info@skatiminvitation.id"];
// Admin: kelola di Supabase Auth + profiles.role/status (jangan simpan password di kode).
// Nomor WhatsApp admin untuk permohonan approve dapat diubah di Panel Admin (app_settings.admin_wa).
export const DEFAULT_ADMIN_WA = "6281234567890";
