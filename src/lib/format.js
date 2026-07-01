export function formatSalary(min, max) {
  return `₹${formatInr(min)}–₹${formatInr(max)}`;
}

export function formatInr(n) {
  if (n == null) return "—";
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
}

export function formatRupees(paise) {
  if (paise == null) return "—";
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const sec = (Date.now() - d.getTime()) / 1000;
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 30 * 86400) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString();
}
