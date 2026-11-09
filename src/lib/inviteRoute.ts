export function getPublicInviteSlug(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const q = params.get("invite") || params.get("toSlug") || params.get("slug");
  if (q) return clean(q);
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash && !["", "admin", "settings", "pending", "tema", "fitur", "harga", "beranda"].includes(hash) && !hash.startsWith("admin") && !hash.startsWith("settings") && !hash.startsWith("pending")) {
    const h = hash.split("?")[0].split("/")[0];
    if (h && !h.includes("=")) return clean(h);
  }
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/" || path === "/index.html") return null;
  const seg = path.split("/").filter(Boolean);
  if (seg.length !== 1) return null;
  const name = seg[0].toLowerCase();
  if (["admin", "settings", "pending", "assets", "images", "favicon.ico"].includes(name)) return null;
  return clean(seg[0]);
}
function clean(v: string) {
  const s = v.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").replace(/--+/g, "-");
  return /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(s) ? s : null;
}
