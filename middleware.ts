import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://vpkyeisjdyupoaeyrguk.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwa3llaXNqZHl1cG9hZXlyZ3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxNjcwMjYsImV4cCI6MjEwOTc0MzAyNn0._vrIUD1CWENiniui6JDREr7bcAF-U_qtzKYfFNmAc8M";

const RESERVED = new Set(["admin", "settings", "pending", "assets", "images", "api", "favicon.ico", "index.html"]);

function clean(v: string | null | undefined) {
  if (!v) return null;
  const s = v.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").replace(/--+/g, "-");
  return /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(s) ? s : null;
}

function getSlug(url: URL): string | null {
  const q = clean(url.searchParams.get("invite") || url.searchParams.get("toSlug") || url.searchParams.get("slug"));
  if (q) return q;
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path === "/" || path === "/index.html") return null;
  const seg = path.split("/").filter(Boolean);
  if (seg.length !== 1) return null;
  const name = seg[0].toLowerCase();
  if (RESERVED.has(name) || name.includes(".")) return null;
  return clean(seg[0]);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const config = {
  matcher: ["/((?!api|assets|images|.*\\.[^/]+$).*)"],
};

export default async function middleware(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const slug = getSlug(url);
    if (!slug) return;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const pub = await supabase.rpc("fetch_published_invitation", { p_slug: slug });
    const row: any = Array.isArray(pub.data) ? pub.data[0] : pub.data;
    if (pub.error || !row) return;

    const settings = row.settings || {};
    const couple = settings?.couple || {};
    const g = couple?.groom?.name || "";
    const b = couple?.bride?.name || "";
    const pair = g && b ? `${g} & ${b}` : g || b || "";
    const titleText = (row.title || settings?.general?.title || pair || "Undangan Digital").trim();
    const descText = (pair ? `Undangan pernikahan ${pair}. Buka untuk melihat detail acara.` : `Undangan digital ${titleText}.`).trim();
    const image = settings?.hero?.coverImageUrl || couple?.groom?.photoUrl || couple?.bride?.photoUrl || "/images/venue-masjid.jpg";
    const imageUrl = new URL(image, url.origin).toString();
    const pageUrl = new URL(url.pathname === "/" ? `/?invite=${slug}` : url.pathname, url.origin).toString();

    const indexUrl = new URL("/index.html", url.origin);
    const res = await fetch(indexUrl.toString(), { headers: { accept: "text/html" } });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok || !ct.includes("text/html")) return;
    let html = await res.text();

    const t = escapeHtml(titleText);
    const d = escapeHtml(descText);
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${t}</title>`);
    html = html.replace(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${d}" />`);

    const tags = [
      `<meta property="og:type" content="website" />`,
      `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
      `<meta property="og:title" content="${t}" />`,
      `<meta property="og:description" content="${d}" />`,
      `<meta property="og:image" content="${escapeHtml(imageUrl)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${t}" />`,
      `<meta name="twitter:description" content="${d}" />`,
      `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`,
    ].join("\n    ");
    html = html.replace(/<\/head>/i, `    ${tags}\n  </head>`);

    const headers = new Headers(res.headers);
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set("cache-control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
    return new Response(html, { status: 200, headers });
  } catch {
    return;
  }
}
