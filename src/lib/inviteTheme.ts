export type InviteTheme = {
  key: "islami" | "jawa" | "default";
  pattern: string;
  pageBg: string;
  panelBg: string;
  primary: string;
  accent: string;
  accentSoft: string;
  text: string;
  muted: string;
  card: string;
  coverBg: string;
  coverText: string;
  heroSub: string;
  divider: string;
  frame: string;
  scriptClass: string;
  serifClass: string;
  opening: string;
  coupleTitle: string;
  eventTitle: string;
  galleryBg: string;
  galleryTitle: string;
  footerBg: string;
  footerText: string;
};

export function getInviteTheme(themeId: string): InviteTheme {
  const id = (themeId || "").toLowerCase();
  if (id.includes("jawa")) {
    return {
      key: "jawa",
      pattern: "jawa-pattern",
      pageBg: "bg-[#2a1d14]",
      panelBg: "bg-[#2a1d14]",
      primary: "#4a3424",
      accent: "#c89b3c",
      accentSoft: "#ead7a1",
      text: "#3f2d1f",
      muted: "#6b5543",
      card: "bg-[#fffaf0]/92",
      coverBg: "bg-[#3b2618]",
      coverText: "text-[#f6e7c1]",
      heroSub: "Panggih Penganten",
      divider: "jawa-divider",
      frame: "jawa-frame",
      scriptClass: "font-script",
      serifClass: "font-noto-serif",
      opening: "Panggih Penganten",
      coupleTitle: "Penganten",
      eventTitle: "Reroncening Acara",
      galleryBg: "bg-[#3b2618]",
      galleryTitle: "Galeri Pawiwahan",
      footerBg: "bg-[#3b2618]",
      footerText: "text-[#f6e7c1]",
    };
  }
  if (id.includes("islami") || id.includes("sakinah") || id.includes("emerald")) {
    return {
      key: "islami",
      pattern: "islami-pattern",
      pageBg: "bg-[#0f1f19]",
      panelBg: "bg-[#10231d]",
      primary: "#325346",
      accent: "#d4af37",
      accentSoft: "#f3d98b",
      text: "#325346",
      muted: "#52695f",
      card: "bg-white/85",
      coverBg: "bg-[#325346]",
      coverText: "text-[#f3d98b]",
      heroSub: "The Wedding of",
      divider: "islami-divider",
      frame: "islami-frame",
      scriptClass: "font-script",
      serifClass: "font-noto-serif",
      opening: "The Wedding of",
      coupleTitle: "Mempelai",
      eventTitle: "Rangkaian Acara",
      galleryBg: "bg-[#325346]",
      galleryTitle: "Galeri Momen",
      footerBg: "bg-[#325346]",
      footerText: "text-[#d4af37]",
    };
  }
  return {
    key: "default",
    pattern: "bg-surface-container-lowest",
    pageBg: "bg-[#1b2f28]",
    panelBg: "bg-[#10231d]",
    primary: "#325346",
    accent: "#775a19",
    accentSoft: "#fed488",
    text: "#1b1c1a",
    muted: "#52695f",
    card: "bg-white",
    coverBg: "bg-[#325346]",
    coverText: "text-white",
    heroSub: "The Wedding of",
    divider: "islami-divider",
    frame: "islami-frame",
    scriptClass: "font-script",
    serifClass: "font-noto-serif",
    opening: "The Wedding of",
    coupleTitle: "Mempelai",
    eventTitle: "Rangkaian Acara",
    galleryBg: "bg-[#325346]",
    galleryTitle: "Galeri Momen",
    footerBg: "bg-[#325346]",
    footerText: "text-[#d4af37]",
  };
}
