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

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function fetchPublished(slug: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 3500);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fetch_published_invitation`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_slug: slug }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  } catch { return null; } finally { clearTimeout(t); }
}

export const config = {
  matcher: ["/((?!api|assets|images|.*\\..*).*)"],
};

export default async function middleware(request: Request): Promise<Response | void> {
  try {
    if (request.method !== "GET") return;
    const ua = (request.headers.get("user-agent") || "").toLowerCase();
    // avoid heavy work for normal browsers; serve OG-enriched HTML to crawlers/unfurlers
    const wantsOg = /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|slackbot|discordbot|linkedinbot|pinterest|skypeuripreview|googlebot|bingbot|embedly|quora link preview|vkshare|line/i.test(ua) || request.headers.get("x-og-preview") === "1";
    if (!wantsOg) return;

    const url = new URL(request.url);
    const slug = getSlug(url);
    if (!slug) return;

    const row: any = await fetchPublished(slug);
    if (!row || row.status !== "published") return;

    const settings = row.settings || {};
    const couple = settings?.couple || {};
    const g = couple?.groom?.name || "";
    const b = couple?.bride?.name || "";
    const pair = g && b ? `${g} & ${b}` : g || b || "";
    const titleText = String(row.title || settings?.general?.title || pair || "Undangan Digital").trim();
    const descText = String(pair ? `Undangan pernikahan ${pair}. Buka untuk melihat detail acara.` : `Undangan digital ${titleText}.`).trim();
    const image = settings?.hero?.coverImageUrl || couple?.groom?.photoUrl || couple?.bride?.photoUrl || "/images/venue-masjid.jpg";
    const imageUrl = /^https?:\/\//i.test(String(image)) ? String(image) : new URL(String(image || "/images/venue-masjid.jpg"), url.origin).toString();
    const pageUrl = new URL(url.pathname, url.origin).toString();

    const indexRes = await fetch(new URL("/index.html", url.origin).toString(), { headers: { accept: "text/html" } });
    const ct = indexRes.headers.get("content-type") || "";
    if (!indexRes.ok || !ct.includes("text/html")) return;
    let html = await indexRes.text();

    const t = esc(titleText);
    const d = esc(descText);
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${t}</title>`);
    html = html.replace(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${d}" />`);

    const tags = [
      `<meta property="og:type" content="website" />`,
      `<meta property="og:url" content="${esc(pageUrl)}" />`,
      `<meta property="og:title" content="${t}" />`,
      `<meta property="og:description" content="${d}" />`,
      `<meta property="og:image" content="${esc(imageUrl)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${t}" />`,
      `<meta name="twitter:description" content="${d}" />`,
      `<meta name="twitter:image" content="${esc(imageUrl)}" />`,
    ].join("\n    ");
    html = html.replace(/<\/head>/i, `    ${tags}\n  </head>`);

    const headers = new Headers(indexRes.headers);
    headers.set("content-type", "text/html; charset=utf-8");
    headers.set("cache-control", "public, max-age=0, s-maxage=120, stale-while-revalidate=600");
    return new Response(html, { status: 200, headers });
  } catch {
    return;
  }
}
