export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

function endpoint(): string {
  const v = (import.meta as any).env?.VITE_UPLOAD_URL;
  return (typeof v === "string" && v.trim()) ? v.trim() : "/upload.php";
}

export async function uploadMedia(file: File): Promise<UploadResult> {
  const url = endpoint();
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await fetch(url, { method: "POST", body: fd });
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("application/json") ? await res.json().catch(() => null) : null;
    if (!res.ok) return { ok: false, error: (data && (data.error || data.message)) || `Upload gagal (HTTP ${res.status}).` };
    const out = data?.url || data?.location || data?.path || (typeof data === "string" ? data : "");
    if (!out) return { ok: false, error: "Respons upload tidak berisi URL. Pastikan endpoint mengembalikan {\"url\":\"...\"}." };
    return { ok: true, url: String(out) };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Gagal mengunggah. Pastikan endpoint upload tersedia (VITE_UPLOAD_URL atau /upload.php di hosting) dan folder uploads dapat ditulis." };
  }
}
