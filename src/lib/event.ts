export const EVENT_DATE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
export const EVENT_GREGORIAN = EVENT_DATE.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
export const EVENT_HIJRI = "Tanggal acara (opsional)";
export function guestNameFromUrl() {
  const p = new URLSearchParams(window.location.search);
  return p.get("to") || p.get("guest") || "Tamu Undangan";
}
